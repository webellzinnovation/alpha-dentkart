/**
 * Cache Utility with TTL (Time-To-Live) Support
 * Implements Stale-While-Revalidate pattern for instant data access
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, invalidations: 0 };

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.ttl) {
      // Data expired
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Store data with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert minutes to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.stats.sets++;
  }

  /**
   * Check if cache exists and is fresh (not expired)
   */
  isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Check if cache exists (even if expired)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache age in milliseconds
   */
  getAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return Date.now() - entry.timestamp;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    this.stats.invalidations++;
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        this.stats.invalidations++;
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.invalidations++;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%';
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate
    };
  }

  /**
   * Get all cached keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Singleton instance
export const cache = new CacheManager();

// Cache keys
export const CACHE_KEYS = {
  PRODUCTS: 'products_all',
  PRODUCTS_PAGE: (page: number, limit: number) => `products_page_${page}_${limit}`,
  CATEGORIES: 'categories_all',
  BRANDS: 'brands_all',
  HERO_SLIDES: 'hero_slides',
  PROMO_TILES: 'promo_tiles',
  SETTINGS: 'settings',
  USER: 'user_data',
  CART: 'cart_data',
  ORDERS: 'orders',
  SEARCH_RESULTS: (query: string) => `search_${query}`,
  CATEGORY_PRODUCTS: (categoryId: number) => `category_products_${categoryId}`,
  BRAND_PRODUCTS: (brandId: number) => `brand_products_${brandId}`,
};

// Default TTL values (in minutes)
export const CACHE_TTL = {
  PRODUCTS: 5,           // 5 minutes - products update frequently
  CATEGORIES: 30,        // 30 minutes - rarely change
  BRANDS: 30,            // 30 minutes - rarely change
  HERO_SLIDES: 15,       // 15 minutes - marketing updates
  PROMO_TILES: 15,       // 15 minutes
  SETTINGS: 5,           // 5 minutes - admin may update
  USER: 15,              // 15 minutes - session data
  CART: 60,              // 1 hour - persist longer
  ORDERS: 1,             // 1 minute - admin data, refresh often
  SEARCH: 5,             // 5 minutes
};

export default cache;
