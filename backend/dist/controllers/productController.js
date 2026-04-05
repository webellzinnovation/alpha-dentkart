"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllProducts = getAllProducts;
exports.getProductById = getProductById;
const firebase_1 = require("../config/firebase");
const cacheService_1 = require("../services/cacheService");
const generateKeywords_1 = require("../utils/generateKeywords");
const logger_1 = __importDefault(require("../utils/logger"));
const CATEGORIES_CACHE_KEY = 'cache:all_categories';
const BRANDS_CACHE_KEY = 'cache:all_brands';
async function getCachedCategories() {
    let cached = await cacheService_1.cacheService.get(CATEGORIES_CACHE_KEY);
    if (cached)
        return new Map(Object.entries(cached));
    const snapshot = await firebase_1.db.collection('categories').get();
    const map = new Map();
    snapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
    await cacheService_1.cacheService.set(CATEGORIES_CACHE_KEY, Object.fromEntries(map), 3600);
    return map;
}
async function getCachedBrands() {
    let cached = await cacheService_1.cacheService.get(BRANDS_CACHE_KEY);
    if (cached)
        return new Map(Object.entries(cached));
    const snapshot = await firebase_1.db.collection('brands').get();
    const map = new Map();
    snapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
    await cacheService_1.cacheService.set(BRANDS_CACHE_KEY, Object.fromEntries(map), 3600);
    return map;
}
async function getAllProducts(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 24, 100);
        const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
        const brandId = req.query.brandId ? String(req.query.brandId) : undefined;
        const search = req.query.search;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        const cacheKey = `products:page:${page}:limit:${limit}:cat:${categoryId}:brand:${brandId}:search:${search || 'none'}:sort:${sortBy}:${sortOrder}`;
        let cached = await cacheService_1.cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        let productsRef = firebase_1.db.collection('products');
        if (categoryId)
            productsRef = productsRef.where('categoryId', '==', categoryId);
        if (brandId)
            productsRef = productsRef.where('brandId', '==', brandId);
        if (search) {
            const searchTokens = (0, generateKeywords_1.generateKeywords)(search).slice(0, 10);
            if (searchTokens.length > 0) {
                productsRef = productsRef.where('keywords', 'array-contains-any', searchTokens);
            }
        }
        const validSortFields = ['createdAt', 'name', 'price'];
        const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';
        productsRef = productsRef.orderBy(orderField, orderDir);
        const countSnapshot = await productsRef.count().get();
        const total = countSnapshot.data().count;
        const offset = (page - 1) * limit;
        productsRef = productsRef.offset(offset).limit(limit);
        const snapshot = await productsRef.get();
        const [categoryMap, brandMap] = await Promise.all([
            getCachedCategories(),
            getCachedBrands()
        ]);
        const products = snapshot.docs.map(doc => {
            const data = doc.data();
            const category = data.categoryId ? categoryMap.get(String(data.categoryId)) || null : null;
            const brand = data.brandId ? brandMap.get(String(data.brandId)) || null : null;
            return {
                id: doc.id,
                ...data,
                category,
                brand,
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
        await cacheService_1.cacheService.set(cacheKey, response, 900);
        res.json(response);
    }
    catch (error) {
        logger_1.default.error('GetAllProducts error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}
async function getProductById(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const cacheKey = `product:${id}`;
        let cached = await cacheService_1.cacheService.get(cacheKey);
        if (cached)
            return res.json({ product: cached });
        const docRef = firebase_1.db.collection('products').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const data = doc.data();
        const [categoryMap, brandMap] = await Promise.all([
            getCachedCategories(),
            getCachedBrands()
        ]);
        const category = data.categoryId ? categoryMap.get(String(data.categoryId)) || null : null;
        const brand = data.brandId ? brandMap.get(String(data.brandId)) || null : null;
        const product = {
            id: doc.id,
            ...data,
            category,
            brand,
            images: data.images || [],
            features: data.features || [],
            specs: data.specs || {},
            attributes: data.attributes || [],
            variations: data.variations || [],
        };
        await cacheService_1.cacheService.set(cacheKey, product, 1800);
        res.json({ product });
    }
    catch (error) {
        logger_1.default.error('GetProductById error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
//# sourceMappingURL=productController.js.map