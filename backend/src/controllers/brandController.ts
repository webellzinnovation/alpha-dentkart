import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

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

        res.json({ message: 'Featured brands reordered successfully' });
    } catch (error) {
        logger.error('Error reordering featured brands:', error);
        res.status(500).json({ error: 'Failed to reorder brands' });
    }
}
