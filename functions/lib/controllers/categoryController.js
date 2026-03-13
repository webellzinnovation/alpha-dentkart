"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = getAllCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const firebase_1 = require("../config/firebase");
const cacheService_1 = require("../services/cacheService");
const logger_1 = __importDefault(require("../utils/logger"));
const woocommerce_rest_api_1 = __importDefault(require("@woocommerce/woocommerce-rest-api"));
// WooCommerce API configuration
const WP_URL = process.env.WP_URL || "https://alphadentkart.com";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY || "ck_b41b9f56dc6245691a0d563b4e40a92e81f7b031";
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET || "cs_49ea401b7c76be3bd64c4edf0a2f73afe5ca08b1";
const wooApi = new woocommerce_rest_api_1.default({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3"
});
// In-memory cache fallback
const memoryCache = {};
const CACHE_TTL = 300; // 5 minutes
// Fetch categories from WooCommerce as fallback
async function fetchCategoriesFromWooCommerce() {
    try {
        const response = await wooApi.get("products/categories", { per_page: 100 });
        return response.data.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image: cat.image?.src || null,
            count: cat.count,
            createdAt: cat.date_created
        }));
    }
    catch (error) {
        logger_1.default.error('Error fetching from WooCommerce:', error);
        return [];
    }
}
async function getAllCategories(req, res) {
    try {
        const cacheKey = 'categories:all';
        // Check memory cache first
        const memCached = memoryCache[cacheKey];
        if (memCached && Date.now() - memCached.timestamp < CACHE_TTL * 1000) {
            return res.json(memCached.data);
        }
        let categories = [];
        try {
            const snapshot = await (0, firebase_1.withTimeout)(firebase_1.db.collection('categories').get());
            if (!snapshot.empty) {
                categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            }
        }
        catch (firestoreError) {
            logger_1.default.warn('Firestore categories not available, using WooCommerce fallback:', firestoreError.message);
        }
        // If no categories in Firestore, fetch from WooCommerce
        if (categories.length === 0) {
            logger_1.default.info('Fetching categories from WooCommerce...');
            categories = await fetchCategoriesFromWooCommerce();
        }
        const response = { categories };
        // Cache the result
        memoryCache[cacheKey] = { data: response, timestamp: Date.now() };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        logger_1.default.error('Error fetching categories:', error);
        // Final fallback - try WooCommerce directly
        try {
            const wooCategories = await fetchCategoriesFromWooCommerce();
            if (wooCategories.length > 0) {
                return res.json({ categories: wooCategories });
            }
        }
        catch (wooError) {
            // Ignore WooCommerce errors
        }
        res.status(500).json({ error: 'Failed to fetch categories: ' + error.message });
    }
}
async function createCategory(req, res) {
    try {
        const { name, icon, ...otherData } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const newCategory = {
            name,
            icon: icon || 'folder',
            ...otherData,
            createdAt: new Date().toISOString()
        };
        const docRef = await firebase_1.db.collection('categories').add(newCategory);
        await cacheService_1.cacheService.invalidateCategoriesCache();
        res.status(201).json({
            message: 'Category created successfully',
            category: { id: docRef.id, ...newCategory }
        });
    }
    catch (error) {
        logger_1.default.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
}
async function updateCategory(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;
        const docRef = firebase_1.db.collection('categories').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Category not found' });
        }
        updates.updatedAt = new Date().toISOString();
        await docRef.update(updates);
        await cacheService_1.cacheService.invalidateCategoriesCache();
        res.json({ message: 'Category updated successfully' });
    }
    catch (error) {
        logger_1.default.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
}
async function deleteCategory(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = firebase_1.db.collection('categories').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Category not found' });
        }
        await docRef.delete();
        await cacheService_1.cacheService.invalidateCategoriesCache();
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}
//# sourceMappingURL=categoryController.js.map