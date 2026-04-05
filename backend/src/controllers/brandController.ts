import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import { cacheService } from '../services/cacheService';
import logger from '../utils/logger';

// Get all brands
export async function getAllBrands(req: Request, res: Response) {
    try {
        const { featured } = req.query;
        
        if (featured === 'true') {
            const cacheKey = 'brands:featured';
            let cached = await cacheService.get(cacheKey);
            if (cached) {
                return res.json({ brands: cached });
            }
            
            const snapshot = await db.collection('brands')
                .where('isFeatured', '==', true)
                .orderBy('featuredOrder', 'asc')
                .get();
            const brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            await cacheService.set(cacheKey, brands, 3600);
            return res.json({ brands });
        }
        
        // Use cacheService for all brands
        const brands = await cacheService.getBrands();
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
        await cacheService.invalidateBrandsCache();
        const updatedDoc = await db.collection('brands').doc(String(id)).get();

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
        await cacheService.invalidateBrandsCache();

        res.json({ message: 'Featured brands reordered successfully' });
    } catch (error) {
        logger.error('Error reordering featured brands:', error);
        res.status(500).json({ error: 'Failed to reorder brands' });
    }
}
