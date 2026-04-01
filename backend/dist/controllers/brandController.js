"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBrands = getAllBrands;
exports.toggleBrandFeatured = toggleBrandFeatured;
exports.reorderFeaturedBrands = reorderFeaturedBrands;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
// Get all brands
async function getAllBrands(req, res) {
    try {
        const { featured } = req.query;
        let query = firebase_1.db.collection('brands');
        if (featured === 'true') {
            query = query.where('isFeatured', '==', true).orderBy('featuredOrder', 'asc');
        }
        else {
            query = query.orderBy('name', 'asc');
        }
        const snapshot = await query.get();
        const brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ brands });
    }
    catch (error) {
        logger_1.default.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
}
// Toggle brand featured status
async function toggleBrandFeatured(req, res) {
    try {
        const { id } = req.params;
        const { isFeatured, featuredOrder } = req.body;
        const updates = { isFeatured };
        if (featuredOrder !== undefined) {
            updates.featuredOrder = featuredOrder;
        }
        await firebase_1.db.collection('brands').doc(String(id)).update(updates);
        const updatedDoc = await firebase_1.db.collection('brands').doc(String(id)).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    catch (error) {
        logger_1.default.error('Error toggling brand featured status:', error);
        res.status(500).json({ error: 'Failed to update brand' });
    }
}
// Reorder featured brands
async function reorderFeaturedBrands(req, res) {
    try {
        const { brands } = req.body; // Array of { id, featuredOrder }
        const batch = firebase_1.db.batch();
        brands.forEach((brand) => {
            const ref = firebase_1.db.collection('brands').doc(String(brand.id));
            batch.update(ref, { featuredOrder: brand.featuredOrder });
        });
        await batch.commit();
        res.json({ message: 'Featured brands reordered successfully' });
    }
    catch (error) {
        logger_1.default.error('Error reordering featured brands:', error);
        res.status(500).json({ error: 'Failed to reorder brands' });
    }
}
//# sourceMappingURL=brandController.js.map