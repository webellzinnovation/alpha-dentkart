"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
class CacheService {
    constructor() {
        this.redis = null;
        this.isRedisConnected = false;
        // Memory cache fallback
        this.memoryCache = new Map();
        this.initializeRedis();
    }
    async initializeRedis() {
        try {
            if (process.env.REDIS_URL) {
                this.redis = new ioredis_1.default(process.env.REDIS_URL, {
                    maxRetriesPerRequest: 3,
                    lazyConnect: true
                });
                this.redis.on('connect', () => {
                    logger_1.default.info('Redis connected for caching');
                    this.isRedisConnected = true;
                });
                this.redis.on('error', (err) => {
                    logger_1.default.warn('Redis connection failed, using memory cache', { error: err.message });
                    this.isRedisConnected = false;
                });
                await this.redis.connect();
            }
        }
        catch (error) {
            logger_1.default.warn('Redis not available, using memory cache fallback');
            this.isRedisConnected = false;
            this.redis = null;
        }
    }
    getMemoryCache(key) {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }
        this.memoryCache.delete(key);
        return null;
    }
    setMemoryCache(key, data, ttl) {
        this.memoryCache.set(key, {
            data,
            expiry: Date.now() + ttl * 1000
        });
        // Clean up expired entries periodically
        if (this.memoryCache.size > 100) {
            this.cleanupMemoryCache();
        }
    }
    cleanupMemoryCache() {
        const now = Date.now();
        for (const [key, value] of this.memoryCache.entries()) {
            if (value.expiry <= now) {
                this.memoryCache.delete(key);
            }
        }
    }
    // Cache operations
    async get(key) {
        try {
            if (this.isRedisConnected && this.redis) {
                const cached = await this.redis.get(key);
                return cached ? JSON.parse(cached) : null;
            }
            return this.getMemoryCache(key);
        }
        catch (error) {
            logger_1.default.warn('Cache get error:', error);
            return null;
        }
    }
    async set(key, data, ttl = 3600) {
        try {
            const serialized = JSON.stringify(data);
            if (this.isRedisConnected && this.redis) {
                await this.redis.setex(key, ttl, serialized);
            }
            else {
                this.setMemoryCache(key, data, ttl);
            }
        }
        catch (error) {
            logger_1.default.warn('Cache set error:', error);
            // Fallback to memory cache
            this.setMemoryCache(key, data, ttl);
        }
    }
    async del(key) {
        try {
            if (this.isRedisConnected && this.redis) {
                await this.redis.del(key);
            }
            this.memoryCache.delete(key);
        }
        catch (error) {
            logger_1.default.warn('Cache delete error:', error);
        }
    }
    async invalidatePattern(pattern) {
        try {
            if (this.isRedisConnected && this.redis) {
                const keys = await this.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.redis.del(...keys);
                }
            }
            else {
                // Invalidate memory cache keys matching pattern
                for (const [key] of this.memoryCache.entries()) {
                    if (key.includes(pattern.replace('*', ''))) {
                        this.memoryCache.delete(key);
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.warn('Cache pattern delete error:', error);
        }
    }
    // Specific cache methods for Firestore data
    async getProducts(options = {}) {
        const cacheKey = `products:${JSON.stringify(options)}`;
        let products = await this.get(cacheKey);
        if (!products) {
            let query = firebase_1.db.collection('products').orderBy('createdAt', 'desc');
            if (options.category) {
                query = query.where('categoryName', '==', options.category);
            }
            if (options.brand) {
                query = query.where('brandName', '==', options.brand);
            }
            if (options.limit) {
                query = query.limit(options.limit);
            }
            const snapshot = await query.get();
            products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            await this.set(cacheKey, products, 1800); // 30 minutes cache
        }
        return products;
    }
    async getCategories() {
        const cacheKey = 'categories:all';
        let categories = await this.get(cacheKey);
        if (!categories) {
            const snapshot = await firebase_1.db.collection('categories').get();
            categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Note: Firestore doesn't support _count automatically without manual aggregation
            // For now we just return the categories
            await this.set(cacheKey, categories, 3600); // 1 hour cache
        }
        return categories;
    }
    async getBrands() {
        const cacheKey = 'brands:all';
        let brands = await this.get(cacheKey);
        if (!brands) {
            const snapshot = await firebase_1.db.collection('brands').orderBy('name', 'asc').get();
            brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            await this.set(cacheKey, brands, 3600); // 1 hour cache
        }
        return brands;
    }
    async getFeaturedProducts() {
        const cacheKey = 'products:featured';
        let products = await this.get(cacheKey);
        if (!products) {
            const snapshot = await firebase_1.db.collection('products')
                .where('badge', '==', 'featured')
                .orderBy('createdAt', 'desc')
                .limit(6)
                .get();
            products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Fallback if no featured products
            if (products.length === 0) {
                const fallbackSnapshot = await firebase_1.db.collection('products')
                    .where('price', '>', 5000)
                    .orderBy('price', 'desc')
                    .limit(6)
                    .get();
                products = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            await this.set(cacheKey, products, 1800); // 30 minutes cache
        }
        return products;
    }
    // Invalidate cache when data changes
    async invalidateProductsCache() {
        await this.invalidatePattern('products:*');
    }
    async invalidateCategoriesCache() {
        await this.invalidatePattern('categories:*');
        await this.invalidatePattern('products:*'); // Products depend on categories
    }
    async invalidateBrandsCache() {
        await this.invalidatePattern('brands:*');
        await this.invalidatePattern('products:*'); // Products depend on brands
    }
    // Health check
    async healthCheck() {
        return {
            redis: this.isRedisConnected,
            memoryCacheSize: this.memoryCache.size
        };
    }
    // Cleanup on shutdown
    async disconnect() {
        if (this.redis) {
            await this.redis.disconnect();
        }
    }
}
// Export singleton instance
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
//# sourceMappingURL=cacheService.js.map