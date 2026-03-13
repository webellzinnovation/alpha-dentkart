import { Request, Response } from 'express';
import { db, withTimeout } from '../config/firebase';
import logger from '../utils/logger';

const SETTINGS_DOC = 'settings/store';

// In-memory cache for settings
let settingsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60; // 1 minute for settings

// Get store settings
export const getSettings = async (req: Request, res: Response) => {
    try {
        // Check memory cache first (fastest)
        if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL * 1000) {
            return res.json({ settings: settingsCache.data });
        }

        const doc = await withTimeout(db.doc(SETTINGS_DOC).get());
        if (!doc.exists) {
            // Return default settings if none exist
            return res.json({ settings: null });
        }
        
        const settings = doc.data();
        
        // Cache the result
        settingsCache = { data: settings, timestamp: Date.now() };
        
        res.json({ settings });
    } catch (error: any) {
        logger.error('Error fetching settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to fetch settings' });
    }
};

// Update store settings (admin only)
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body;
        await withTimeout(db.doc(SETTINGS_DOC).set(
            { ...updates, updatedAt: new Date().toISOString() },
            { merge: true }
        ));
        
        // Clear cache
        settingsCache = null;
        
        const updated = await withTimeout(db.doc(SETTINGS_DOC).get());
        res.json({ settings: updated.data(), message: 'Settings saved successfully' });
    } catch (error: any) {
        logger.error('Error updating settings:', error);
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Failed to update settings' });
    }
};
