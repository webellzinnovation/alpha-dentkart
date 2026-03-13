"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = void 0;
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const SETTINGS_DOC = 'settings/store';
// In-memory cache for settings
let settingsCache = null;
const CACHE_TTL = 60; // 1 minute for settings
// Get store settings
const getSettings = async (req, res) => {
    try {
        // Check memory cache first (fastest)
        if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL * 1000) {
            return res.json({ settings: settingsCache.data });
        }
        const doc = await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).get());
        if (!doc.exists) {
            // Return default settings if none exist
            return res.json({ settings: null });
        }
        const settings = doc.data();
        // Cache the result
        settingsCache = { data: settings, timestamp: Date.now() };
        res.json({ settings });
    }
    catch (error) {
        logger_1.default.error('Error fetching settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to fetch settings' });
    }
};
exports.getSettings = getSettings;
// Update store settings (admin only)
const updateSettings = async (req, res) => {
    try {
        const updates = req.body;
        await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true }));
        // Clear cache
        settingsCache = null;
        const updated = await (0, firebase_1.withTimeout)(firebase_1.db.doc(SETTINGS_DOC).get());
        res.json({ settings: updated.data(), message: 'Settings saved successfully' });
    }
    catch (error) {
        logger_1.default.error('Error updating settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to update settings' });
    }
};
exports.updateSettings = updateSettings;
//# sourceMappingURL=settingsController.js.map