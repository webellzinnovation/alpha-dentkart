import { Request, Response } from 'express';
import { db, withTimeout } from '../config/firebase'; // Firestore
import { cacheService } from '../services/cacheService';
import { generateKeywords } from '../utils/generateKeywords';
import logger from '../utils/logger';

export async function getAllProducts(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
        const brandId = req.query.brandId ? String(req.query.brandId) : undefined;
        const search = req.query.search as string;

        // Create cache key with pagination details
        const cacheKey = `products:page:${page}:limit:${limit}:category:${categoryId || 'any'}:brand:${brandId || 'any'}:search:${search || 'none'}`;

        // Try to get from cache first
        let cached = await cacheService.get(cacheKey);
        if (cached) {
            logger.info('Cache hit for paginated products', { cacheKey });
            return res.json(cached);
        }

        let productsRef: FirebaseFirestore.Query = db.collection('products');

        // Apply filters
        if (categoryId) productsRef = productsRef.where('categoryId', '==', categoryId);
        if (brandId) productsRef = productsRef.where('brandId', '==', brandId);

        // Keyword-based search using Firestore array-contains-any
        if (search) {
            const searchTokens = generateKeywords(search).slice(0, 10); // Firestore max 10
            if (searchTokens.length > 0) {
                productsRef = productsRef.where('keywords', 'array-contains-any', searchTokens);
            }
        }

        // Count with aggregation for accurate total
        const countQuery = productsRef;
        const countResult = await withTimeout(countQuery.count().get());
        const total = countResult.data().count;

        // Apply ordering + pagination
        const offset = (page - 1) * limit;
        productsRef = productsRef.orderBy('createdAt', 'desc').offset(offset).limit(limit);

        const snapshot = await withTimeout(productsRef.get());

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
        await cacheService.set(cacheKey, response, 900);
        logger.info('Cached products', { cacheKey });

        res.json(response);
    } catch (error: any) {
        logger.error('GetAllProducts error', { error });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

export async function getProductById(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = db.collection('products').doc(String(id));
        const doc = await withTimeout(docRef.get());

        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const data = doc.data()!;

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
    } catch (error: any) {
        logger.error('GetProductById error', { error, productId: req.params.id });
        const status = error.message?.includes('timed out') ? 504 : 500;
        res.status(status).json({ error: error.message || 'Internal server error' });
    }
}

export async function createProduct(req: Request, res: Response) {
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

        const docRef = await db.collection('products').add(newProduct);
        newProduct.id = docRef.id;

        await cacheService.invalidateProductsCache();

        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        logger.error('CreateProduct error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateProduct(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;

        const docRef = db.collection('products').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        updates.updatedAt = new Date().toISOString();

        await docRef.update(updates);
        await cacheService.invalidateProductsCache();

        res.json({ message: 'Product updated successfully', id });
    } catch (error) {
        logger.error('UpdateProduct error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteProduct(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = db.collection('products').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await docRef.delete();
        await cacheService.invalidateProductsCache();

        res.json({ message: 'Product deleted successfully', id });
    } catch (error) {
        logger.error('DeleteProduct error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
