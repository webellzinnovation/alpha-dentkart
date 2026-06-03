import { Request, Response } from 'express';
import { db, withTimeout } from '../config/firebase';
import { cacheService } from '../services/cacheService';
import logger from '../utils/logger';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

// WooCommerce API configuration
const WP_URL = process.env.WP_URL || "https://alphadentkart.com";
const WP_CONSUMER_KEY = process.env.WP_CONSUMER_KEY;
const WP_CONSUMER_SECRET = process.env.WP_CONSUMER_SECRET;

const wooApi = new WooCommerceRestApi({
    url: WP_URL,
    consumerKey: WP_CONSUMER_KEY,
    consumerSecret: WP_CONSUMER_SECRET,
    version: "wc/v3"
});

// In-memory cache fallback
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 300; // 5 minutes

export function invalidateLocalCache() {
    for (const key in memoryCache) {
        delete memoryCache[key];
    }
}

// Fetch categories from WooCommerce as fallback
async function fetchCategoriesFromWooCommerce(): Promise<any[]> {
    try {
        const response = await wooApi.get("products/categories", { per_page: 100 });
        return response.data.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            image: cat.image?.src || null,
            count: cat.count,
            createdAt: cat.date_created
        }));
    } catch (error) {
        logger.error('Error fetching from WooCommerce:', error);
        return [];
    }
}

export async function getAllCategories(req: Request, res: Response) {
    try {
        let categories: any[] = [];
        
        try {
            const snapshot = await withTimeout(db.collection('categories').get());
            if (!snapshot.empty) {
                categories = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
            }
        } catch (firestoreError: any) {
            logger.warn('Firestore categories not available, using WooCommerce fallback:', firestoreError.message);
        }

        // If no categories in Firestore, fetch from WooCommerce
        if (categories.length === 0) {
            logger.info('Fetching categories from WooCommerce...');
            categories = await fetchCategoriesFromWooCommerce();
        }
        
        res.json({ categories });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        logger.error('Error fetching categories:', error);
        
        // Final fallback - try WooCommerce directly
        try {
            const wooCategories = await fetchCategoriesFromWooCommerce();
            if (wooCategories.length > 0) {
                return res.json({ categories: wooCategories });
            }
        } catch (wooError) {
            // Ignore WooCommerce errors
        }
        
        res.status(500).json({ error: 'Failed to fetch categories: ' + error.message });
    }
}

export async function createCategory(req: Request, res: Response) {
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

        const docRef = await db.collection('categories').add(newCategory);

        // Clear local memory cache
        invalidateLocalCache();

        await cacheService.invalidateCategoriesCache();

        res.status(201).json({
            message: 'Category created successfully',
            category: { id: docRef.id, ...newCategory }
        });
    } catch (error) {
        logger.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
}

export async function updateCategory(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;

        const docRef = db.collection('categories').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Category not found' });
        }

        updates.updatedAt = new Date().toISOString();

        await docRef.update(updates);
        
        // Clear local memory cache
        invalidateLocalCache();
        
        await cacheService.invalidateCategoriesCache();

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        logger.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
}

export async function deleteCategory(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const docRef = db.collection('categories').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Category not found' });
        }

        await docRef.delete();
        
        // Clear local memory cache
        invalidateLocalCache();
        
        await cacheService.invalidateCategoriesCache();

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        logger.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}
