"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderPromotionalTiles = exports.deletePromotionalTile = exports.updatePromotionalTile = exports.createPromotionalTile = exports.getAllPromotionalTiles = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
// Get all promotional tiles (active only for public, all for admin)
const getAllPromotionalTiles = async (req, res) => {
    try {
        const { active, limit } = req.query;
        let query = firebase_1.db.collection('promotional_tiles').orderBy('order', 'asc');
        if (active === 'true') {
            query = query.where('isActive', '==', true);
        }
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        const snapshot = await query.get();
        const tiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(tiles);
    }
    catch (error) {
        logger_1.default.error('Error fetching promotional tiles:', error);
        res.status(500).json({ error: 'Failed to fetch promotional tiles' });
    }
};
exports.getAllPromotionalTiles = getAllPromotionalTiles;
// Create new promotional tile
const createPromotionalTile = async (req, res) => {
    try {
        const { title, subtitle, category, price, image, link, badge, badgeColor, order, isActive } = req.body;
        const newTile = {
            title,
            subtitle,
            category,
            price,
            image,
            link,
            badge,
            badgeColor,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date().toISOString()
        };
        const docRef = await firebase_1.db.collection('promotional_tiles').add(newTile);
        res.status(201).json({ id: docRef.id, ...newTile });
    }
    catch (error) {
        logger_1.default.error('Error creating promotional tile:', error);
        res.status(500).json({ error: 'Failed to create promotional tile' });
    }
};
exports.createPromotionalTile = createPromotionalTile;
// Update promotional tile
const updatePromotionalTile = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Strip undefined
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
        await firebase_1.db.collection('promotional_tiles').doc(String(id)).update(cleanUpdates);
        const updatedDoc = await firebase_1.db.collection('promotional_tiles').doc(String(id)).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    catch (error) {
        logger_1.default.error('Error updating promotional tile:', error);
        res.status(500).json({ error: 'Failed to update promotional tile' });
    }
};
exports.updatePromotionalTile = updatePromotionalTile;
// Delete promotional tile
const deletePromotionalTile = async (req, res) => {
    try {
        const { id } = req.params;
        await firebase_1.db.collection('promotional_tiles').doc(String(id)).delete();
        res.json({ message: 'Promotional tile deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting promotional tile:', error);
        res.status(500).json({ error: 'Failed to delete promotional tile' });
    }
};
exports.deletePromotionalTile = deletePromotionalTile;
// Reorder promotional tiles
const reorderPromotionalTiles = async (req, res) => {
    try {
        const { tiles } = req.body; // Array of { id, order }
        const batch = firebase_1.db.batch();
        tiles.forEach((tile) => {
            const ref = firebase_1.db.collection('promotional_tiles').doc(tile.id);
            batch.update(ref, { order: tile.order });
        });
        await batch.commit();
        res.json({ message: 'Promotional tiles reordered successfully' });
    }
    catch (error) {
        logger_1.default.error('Error reordering promotional tiles:', error);
        res.status(500).json({ error: 'Failed to reorder promotional tiles' });
    }
};
exports.reorderPromotionalTiles = reorderPromotionalTiles;
//# sourceMappingURL=promotionalTileController.js.map