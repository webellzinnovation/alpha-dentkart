declare class CacheService {
    private redis;
    private isRedisConnected;
    constructor();
    private initializeRedis;
    private memoryCache;
    private getMemoryCache;
    private setMemoryCache;
    private cleanupMemoryCache;
    get(key: string): Promise<any | null>;
    set(key: string, data: any, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
    getProducts(options?: {
        limit?: number;
        category?: string;
        brand?: string;
    }): Promise<any>;
    getCategories(): Promise<any>;
    getBrands(): Promise<any>;
    getFeaturedProducts(): Promise<any>;
    invalidateProductsCache(): Promise<void>;
    invalidateCategoriesCache(): Promise<void>;
    invalidateBrandsCache(): Promise<void>;
    healthCheck(): Promise<{
        redis: boolean;
        memoryCacheSize: number;
    }>;
    disconnect(): Promise<void>;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cacheService.d.ts.map