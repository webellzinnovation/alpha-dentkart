"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBrands = getAllBrands;
exports.toggleBrandFeatured = toggleBrandFeatured;
exports.reorderFeaturedBrands = reorderFeaturedBrands;
exports.createBrand = createBrand;
exports.updateBrand = updateBrand;
exports.deleteBrand = deleteBrand;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
// In-memory cache fallback
const memoryCache = {};
const CACHE_TTL = 300; // 5 minutes
// Get all brands
async function getAllBrands(req, res) {
    try {
        const { featured } = req.query;
        const cacheKey = `brands:featured:${featured || 'all'}`;
        // Check memory cache first
        const memCached = memoryCache[cacheKey];
        if (memCached && Date.now() - memCached.timestamp < CACHE_TTL * 1000) {
            return res.json(memCached.data);
        }
        // Try cache service
        let cached = null;
        try {
            const cacheService = require('../services/cacheService');
            cached = await cacheService.get(cacheKey);
            if (cached)
                return res.json(cached);
        }
        catch (e) { }
        let query = firebase_1.db.collection('brands');
        if (featured === 'true') {
            query = query.where('isFeatured', '==', true).orderBy('featuredOrder', 'asc');
        }
        else {
            query = query.orderBy('name', 'asc');
        }
        const snapshot = await query.get();
        const brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const response = { brands };
        // Cache the result
        memoryCache[cacheKey] = { data: response, timestamp: Date.now() };
        try {
            const cacheService = require('../services/cacheService');
            await cacheService.set(cacheKey, response, 300);
        }
        catch (e) { }
        res.json(response);
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
        // Also invalidate cache since brand has changed
        try {
            const { cacheService } = require('../services/cacheService');
            await cacheService.invalidateBrandsCache();
        }
        catch (e) {
            logger_1.default.warn('Failed to invalidate brands cache', e);
        }
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
        try {
            const { cacheService } = require('../services/cacheService');
            await cacheService.invalidateBrandsCache();
        }
        catch (e) {
            logger_1.default.warn('Failed to invalidate brands cache', e);
        }
        res.json({ message: 'Featured brands reordered successfully' });
    }
    catch (error) {
        logger_1.default.error('Error reordering featured brands:', error);
        res.status(500).json({ error: 'Failed to reorder brands' });
    }
}
const cacheService_1 = require("../services/cacheService");
async function createBrand(req, res) {
    try {
        const { name, ...otherData } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Brand name is required' });
        }
        const newBrand = {
            name,
            ...otherData,
            createdAt: new Date().toISOString(),
            isFeatured: otherData.isFeatured || false
        };
        const docRef = await firebase_1.db.collection('brands').add(newBrand);
        await cacheService_1.cacheService.invalidateBrandsCache();
        res.status(201).json({
            message: 'Brand created successfully',
            brand: { id: docRef.id, ...newBrand }
        });
    }
    catch (error) {
        logger_1.default.error('Error creating brand:', error);
        res.status(500).json({ error: 'Failed to create brand' });
    }
}
async function updateBrand(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;
        const docRef = firebase_1.db.collection('brands').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        updates.updatedAt = new Date().toISOString();
        await docRef.update(updates);
        await cacheService_1.cacheService.invalidateBrandsCache();
        res.json({ message: 'Brand updated successfully' });
    }
    catch (error) {
        logger_1.default.error('Error updating brand:', error);
        res.status(500).json({ error: 'Failed to update brand' });
    }
}
async function deleteBrand(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = firebase_1.db.collection('brands').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        await docRef.delete();
        await cacheService_1.cacheService.invalidateBrandsCache();
        res.json({ message: 'Brand deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting brand:', error);
        res.status(500).json({ error: 'Failed to delete brand' });
    }
}
//# sourceMappingURL=brandController.js.map