import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

// In-memory cache fallback
const memoryCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 300; // 5 minutes

export function invalidateLocalCache() {
    for (const key in memoryCache) {
        delete memoryCache[key];
    }
}

// Get all brands
export async function getAllBrands(req: Request, res: Response) {
    try {
        const { featured } = req.query;

        let query: FirebaseFirestore.Query = db.collection('brands');

        if (featured === 'true') {
            query = query.where('isFeatured', '==', true).orderBy('featuredOrder', 'asc');
        } else {
            query = query.orderBy('name', 'asc');
        }

        const snapshot = await query.get();
        const brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ brands });
    } catch (error) {
        logger.error('Error fetching brands:', error);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
}

// Toggle brand featured status
export async function toggleBrandFeatured(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { isFeatured, featuredOrder } = req.body;

        const updates: any = { isFeatured };
        if (featuredOrder !== undefined) {
            updates.featuredOrder = featuredOrder;
        }

        await db.collection('brands').doc(String(id)).update(updates);
        const updatedDoc = await db.collection('brands').doc(String(id)).get();

        // Clear local memory cache
        invalidateLocalCache();

        // Also invalidate cache since brand has changed
        try {
            const { cacheService } = require('../services/cacheService');
            await cacheService.invalidateBrandsCache();
        } catch (e) {
            logger.warn('Failed to invalidate brands cache', e);
        }

        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        logger.error('Error toggling brand featured status:', error);
        res.status(500).json({ error: 'Failed to update brand' });
    }
}

// Reorder featured brands
export async function reorderFeaturedBrands(req: Request, res: Response) {
    try {
        const { brands } = req.body; // Array of { id, featuredOrder }

        const batch = db.batch();
        brands.forEach((brand: { id: string; featuredOrder: number }) => {
            const ref = db.collection('brands').doc(String(brand.id));
            batch.update(ref, { featuredOrder: brand.featuredOrder });
        });

        await batch.commit();

        // Clear local memory cache
        invalidateLocalCache();

        try {
            const { cacheService } = require('../services/cacheService');
            await cacheService.invalidateBrandsCache();
        } catch (e) {
            logger.warn('Failed to invalidate brands cache', e);
        }

        res.json({ message: 'Featured brands reordered successfully' });
    } catch (error) {
        logger.error('Error reordering featured brands:', error);
        res.status(500).json({ error: 'Failed to reorder brands' });
    }
}

import { cacheService } from '../services/cacheService';

export async function createBrand(req: Request, res: Response) {
    try {
        const { name, ...otherData } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Brand name is required' });
        }

        const newBrand = {
            name,
            ...otherData,
            createdAt: new Date().toISOString(),
            isFeatured: otherData.isFeatured || false
        };

        const docRef = await db.collection('brands').add(newBrand);
        
        // Clear local memory cache
        invalidateLocalCache();
        
        await cacheService.invalidateBrandsCache();

        res.status(201).json({
            message: 'Brand created successfully',
            brand: { id: docRef.id, ...newBrand }
        });
    } catch (error) {
        logger.error('Error creating brand:', error);
        res.status(500).json({ error: 'Failed to create brand' });
    }
}

export async function updateBrand(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;

        const docRef = db.collection('brands').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        updates.updatedAt = new Date().toISOString();

        await docRef.update(updates);
        
        // Clear local memory cache
        invalidateLocalCache();
        
        await cacheService.invalidateBrandsCache();

        res.json({ message: 'Brand updated successfully' });
    } catch (error) {
        logger.error('Error updating brand:', error);
        res.status(500).json({ error: 'Failed to update brand' });
    }
}

export async function deleteBrand(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const docRef = db.collection('brands').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Brand not found' });
        }

        await docRef.delete();
        
        // Clear local memory cache
        invalidateLocalCache();
        
        await cacheService.invalidateBrandsCache();

        res.json({ message: 'Brand deleted successfully' });
    } catch (error) {
        logger.error('Error deleting brand:', error);
        res.status(500).json({ error: 'Failed to delete brand' });
    }
}
