import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
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

        // Create cache key
        const cacheKey = `products:page:${page}:limit:${limit}:category:${categoryId}:brand:${brandId}:search:${search || 'none'}`;

        // Try to get from cache first
        let cached = await cacheService.get(cacheKey);
        if (cached) {
            logger.info('Cache hit for products', { cacheKey });
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

        // Get total count for current filters
        const countSnapshot = await productsRef.get();
        const total = countSnapshot.size;

        // Calculate offset and apply pagination
        const offset = (page - 1) * limit;
        productsRef = productsRef.orderBy('createdAt', 'desc').offset(offset).limit(limit);

        const snapshot = await productsRef.get();

        // Fetch related data (Category & Brand)
        const products = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Fetch Category
            let category = null;
            if (data.categoryId) {
                const catDoc = await db.collection('categories').doc(String(data.categoryId)).get();
                if (catDoc.exists) category = { id: catDoc.id, ...catDoc.data() };
            }

            // Fetch Brand
            let brand = null;
            if (data.brandId) {
                const brandDoc = await db.collection('brands').doc(String(data.brandId)).get();
                if (brandDoc.exists) brand = { id: brandDoc.id, ...brandDoc.data() };
            }

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
        }));

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
    } catch (error) {
        logger.error('GetAllProducts error', { error });
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getProductById(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = db.collection('products').doc(String(id));
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const data = doc.data()!;

        // Fetch Category
        let category = null;
        if (data.categoryId) {
            const catDoc = await db.collection('categories').doc(String(data.categoryId)).get();
            if (catDoc.exists) category = { id: catDoc.id, ...catDoc.data() };
        }

        // Fetch Brand
        let brand = null;
        if (data.brandId) {
            const brandDoc = await db.collection('brands').doc(String(data.brandId)).get();
            if (brandDoc.exists) brand = { id: brandDoc.id, ...brandDoc.data() };
        }

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

        res.json({ product });
    } catch (error) {
        logger.error('GetProductById error', { error, productId: req.params.id });
        res.status(500).json({ error: 'Internal server error' });
    }
}
