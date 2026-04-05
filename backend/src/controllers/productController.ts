import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { cacheService } from '../services/cacheService';
import { generateKeywords } from '../utils/generateKeywords';
import logger from '../utils/logger';

const CATEGORIES_CACHE_KEY = 'cache:all_categories';
const BRANDS_CACHE_KEY = 'cache:all_brands';

async function getCachedCategories(): Promise<Map<string, any>> {
    let cached = await cacheService.get(CATEGORIES_CACHE_KEY);
    if (cached) return new Map(Object.entries(cached));

    const snapshot = await db.collection('categories').get();
    const map = new Map<string, any>();
    snapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
    await cacheService.set(CATEGORIES_CACHE_KEY, Object.fromEntries(map), 3600);
    return map;
}

async function getCachedBrands(): Promise<Map<string, any>> {
    let cached = await cacheService.get(BRANDS_CACHE_KEY);
    if (cached) return new Map(Object.entries(cached));

    const snapshot = await db.collection('brands').get();
    const map = new Map<string, any>();
    snapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
    await cacheService.set(BRANDS_CACHE_KEY, Object.fromEntries(map), 3600);
    return map;
}

export async function getAllProducts(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 24, 100);
        const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
        const brandId = req.query.brandId ? String(req.query.brandId) : undefined;
        const search = req.query.search as string;
        const sortBy = req.query.sortBy as string || 'createdAt';
        const sortOrder = req.query.sortOrder as string || 'desc';

        const cacheKey = `products:page:${page}:limit:${limit}:cat:${categoryId}:brand:${brandId}:search:${search || 'none'}:sort:${sortBy}:${sortOrder}`;

        let cached = await cacheService.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        let productsRef: FirebaseFirestore.Query = db.collection('products');

        if (categoryId) productsRef = productsRef.where('categoryId', '==', categoryId);
        if (brandId) productsRef = productsRef.where('brandId', '==', brandId);

        if (search) {
            const searchTokens = generateKeywords(search).slice(0, 10);
            if (searchTokens.length > 0) {
                productsRef = productsRef.where('keywords', 'array-contains-any', searchTokens);
            }
        }

        const validSortFields = ['createdAt', 'name', 'price'];
        const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';
        productsRef = productsRef.orderBy(orderField, orderDir as FirebaseFirestore.OrderByDirection);

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

        await cacheService.set(cacheKey, response, 900);
        res.json(response);
    } catch (error) {
        logger.error('GetAllProducts error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getProductById(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const cacheKey = `product:${id}`;
        let cached = await cacheService.get(cacheKey);
        if (cached) return res.json({ product: cached });

        const docRef = db.collection('products').doc(String(id));
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const data = doc.data()!;
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

        await cacheService.set(cacheKey, product, 1800);
        res.json({ product });
    } catch (error) {
        logger.error('GetProductById error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
