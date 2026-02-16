import Redis from 'ioredis';
import { db } from '../config/firebase';
import logger from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isRedisConnected = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        this.redis.on('connect', () => {
          logger.info('Redis connected for caching');
          this.isRedisConnected = true;
        });

        this.redis.on('error', (err) => {
          logger.warn('Redis connection failed, using memory cache', { error: err.message });
          this.isRedisConnected = false;
        });

        await this.redis.connect();
      }
    } catch (error) {
      logger.warn('Redis not available, using memory cache fallback');
      this.isRedisConnected = false;
      this.redis = null;
    }
  }

  // Memory cache fallback
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  private getMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  private setMemoryCache(key: string, data: any, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl * 1000
    });

    // Clean up expired entries periodically
    if (this.memoryCache.size > 100) {
      this.cleanupMemoryCache();
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Cache operations
  async get(key: string): Promise<any | null> {
    try {
      if (this.isRedisConnected && this.redis) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      }
      return this.getMemoryCache(key);
    } catch (error) {
      logger.warn('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(data);

      if (this.isRedisConnected && this.redis) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        this.setMemoryCache(key, data, ttl);
      }
    } catch (error) {
      logger.warn('Cache set error:', error);
      // Fallback to memory cache
      this.setMemoryCache(key, data, ttl);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      logger.warn('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Invalidate memory cache keys matching pattern
        for (const [key] of this.memoryCache.entries()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      logger.warn('Cache pattern delete error:', error);
    }
  }

  // Specific cache methods for Firestore data
  async getProducts(options: { limit?: number; category?: string; brand?: string } = {}) {
    const cacheKey = `products:${JSON.stringify(options)}`;
    let products = await this.get(cacheKey);

    if (!products) {
      let query = db.collection('products').orderBy('createdAt', 'desc');

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
      const snapshot = await db.collection('categories').get();
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
      const snapshot = await db.collection('brands').orderBy('name', 'asc').get();
      brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      await this.set(cacheKey, brands, 3600); // 1 hour cache
    }

    return brands;
  }

  async getFeaturedProducts() {
    const cacheKey = 'products:featured';
    let products = await this.get(cacheKey);

    if (!products) {
      const snapshot = await db.collection('products')
        .where('badge', '==', 'featured')
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get();

      products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fallback if no featured products
      if (products.length === 0) {
        const fallbackSnapshot = await db.collection('products')
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
export const cacheService = new CacheService();
export default cacheService;