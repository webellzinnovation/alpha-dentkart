"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
const firebase_1 = require("../config/firebase"); // Firestore
const cacheService_1 = require("../services/cacheService");
const generateKeywords_1 = require("../utils/generateKeywords");
const logger_1 = __importDefault(require("../utils/logger"));
async function getAllProducts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
        const brandId = req.query.brandId ? String(req.query.brandId) : undefined;
        const search = req.query.search;
        // Create cache key with pagination details
        const cacheKey = `products:page:${page}:limit:${limit}:category:${categoryId || 'any'}:brand:${brandId || 'any'}:search:${search || 'none'}`;
        // Try to get from cache first
        let cached = await cacheService_1.cacheService.get(cacheKey);
        if (cached) {
            logger_1.default.info('Cache hit for paginated products', { cacheKey });
            return res.json(cached);
        }
        let productsRef = firebase_1.db.collection('products');
        // Apply filters
        if (categoryId)
            productsRef = productsRef.where('categoryId', '==', categoryId);
        if (brandId)
            productsRef = productsRef.where('brandId', '==', brandId);
        // Keyword-based search using Firestore array-contains-any
        if (search) {
            const searchTokens = (0, generateKeywords_1.generateKeywords)(search).slice(0, 10); // Firestore max 10
            if (searchTokens.length > 0) {
                productsRef = productsRef.where('keywords', 'array-contains-any', searchTokens);
            }
        }
        // Count with aggregation for accurate total
        const countQuery = productsRef;
        const countResult = await (0, firebase_1.withTimeout)(countQuery.count().get());
        const total = countResult.data().count;
        // Apply ordering + pagination
        const offset = (page - 1) * limit;
        productsRef = productsRef.orderBy('createdAt', 'desc').offset(offset).limit(limit);
        const snapshot = await (0, firebase_1.withTimeout)(productsRef.get());
        // Map products — use denormalized categoryName/brandName fields
        const products = snapshot.docs.map((doc) => {
            const data = doc.data();
            const categoryName = data.categoryName || data.category || null;
            const brandName = data.brandName || data.brand || null;
            return {
                id: doc.id,
                ...data,
                category: categoryName,
                brand: brandName,
                images: data.images || [],
                features: data.features || [],
                specs: data.specs || {},
                attributes: data.attributes || [],
                variations: data.variations || [],
            };
        });
        const response = {
            products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
        // Cache the response for 15 minutes
        await cacheService_1.cacheService.set(cacheKey, response, 900);
        logger_1.default.info('Cached products', { cacheKey });
        res.json(response);
    }
    catch (error) {
        logger_1.default.error('GetAllProducts error', { error });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}
async function getProductById(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = firebase_1.db.collection('products').doc(String(id));
        const doc = await (0, firebase_1.withTimeout)(docRef.get());
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const data = doc.data();
        // Use denormalized flat name fields (NO sub-queries!)
        const categoryName = data.categoryName || data.category || null;
        const brandName = data.brandName || data.brand || null;
        const product = {
            id: doc.id,
            ...data,
            category: categoryName,
            brand: brandName,
            images: data.images || [],
            features: data.features || [],
            specs: data.specs || {},
            attributes: data.attributes || [],
            variations: data.variations || [],
        };
        res.json({ product });
    }
    catch (error) {
        logger_1.default.error('GetProductById error', { error, productId: req.params.id });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}
async function createProduct(req, res) {
    try {
        const productData = req.body;
        if (!productData.name) {
            return res.status(400).json({ error: 'Product name is required' });
        }
        const newProduct = {
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await firebase_1.db.collection('products').add(newProduct);
        newProduct.id = docRef.id;
        await cacheService_1.cacheService.invalidateProductsCache();
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    }
    catch (error) {
        logger_1.default.error('CreateProduct error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function updateProduct(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;
        const docRef = firebase_1.db.collection('products').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        updates.updatedAt = new Date().toISOString();
        await docRef.update(updates);
        await cacheService_1.cacheService.invalidateProductsCache();
        res.json({ message: 'Product updated successfully', id });
    }
    catch (error) {
        logger_1.default.error('UpdateProduct error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function deleteProduct(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = firebase_1.db.collection('products').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await docRef.delete();
        await cacheService_1.cacheService.invalidateProductsCache();
        res.json({ message: 'Product deleted successfully', id });
    }
    catch (error) {
        logger_1.default.error('DeleteProduct error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=productController.js.map