import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

// Get all promotional tiles (active only for public, all for admin)
export const getAllPromotionalTiles = async (req: Request, res: Response) => {
    try {
        const { active, limit } = req.query;
        let query = db.collection('promotional_tiles').orderBy('order', 'asc');

        if (active === 'true') {
            query = query.where('isActive', '==', true);
        }

        if (limit) {
            query = query.limit(parseInt(limit as string));
        }

        const snapshot = await query.get();
        const tiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Return in {tiles:[]} format matching frontend expectation
        res.json({ tiles });
    } catch (error) {
        logger.error('Error fetching promotional tiles:', error);
        res.status(500).json({ error: 'Failed to fetch promotional tiles' });
    }
};

// Create new promotional tile
export const createPromotionalTile = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, category, price, image, link, badge, badgeColor, order, isActive } = req.body;

        const newTile = {
            title,
            subtitle,
            category,
            price,
            image,
            link,
            badge,
            badgeColor,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date().toISOString()
        };

        const cleanTile = Object.fromEntries(
            Object.entries(newTile).filter(([_, v]) => v !== undefined)
        );

        const docRef = await db.collection('promotional_tiles').add(cleanTile);
        res.status(201).json({ id: docRef.id, ...cleanTile });
    } catch (error) {
        logger.error('Error creating promotional tile:', error);
        res.status(500).json({ error: 'Failed to create promotional tile' });
    }
};

// Update promotional tile
export const updatePromotionalTile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Strip undefined
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await db.collection('promotional_tiles').doc(String(id)).update(cleanUpdates);
        const updatedDoc = await db.collection('promotional_tiles').doc(String(id)).get();

        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        logger.error('Error updating promotional tile:', error);
        res.status(500).json({ error: 'Failed to update promotional tile' });
    }
};

// Delete promotional tile
export const deletePromotionalTile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await db.collection('promotional_tiles').doc(String(id)).delete();

        res.json({ message: 'Promotional tile deleted successfully' });
    } catch (error) {
        logger.error('Error deleting promotional tile:', error);
        res.status(500).json({ error: 'Failed to delete promotional tile' });
    }
};

// Reorder promotional tiles
export const reorderPromotionalTiles = async (req: Request, res: Response) => {
    try {
        const { tiles } = req.body; // Array of { id, order }

        const batch = db.batch();

        tiles.forEach((tile: { id: string; order: number }) => {
            const ref = db.collection('promotional_tiles').doc(tile.id);
            batch.update(ref, { order: tile.order });
        });

        await batch.commit();

        res.json({ message: 'Promotional tiles reordered successfully' });
    } catch (error) {
        logger.error('Error reordering promotional tiles:', error);
        res.status(500).json({ error: 'Failed to reorder promotional tiles' });
    }
};
