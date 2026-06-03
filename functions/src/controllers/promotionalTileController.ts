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

        let snapshot = await query.get();

        // Seed default promotional tiles if collection is empty
        if (snapshot.empty) {
            const defaults = [
                {
                    id: "1",
                    title: "High Speed Airotor Handpiece",
                    category: "Clinic Essential",
                    price: "FROM ₹7,500",
                    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Airotor",
                    link: "/shop?brand=NSK",
                    order: 1,
                    isActive: true
                },
                {
                    id: "2",
                    title: "Composite Restoration Kit",
                    category: "Bundle Deal",
                    price: "FROM ₹16,900",
                    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Composite+Kit",
                    link: "/shop?category=Restorative",
                    order: 2,
                    isActive: true
                },
                {
                    id: "3",
                    title: "Digital Apex Locator V5",
                    category: "New Arrival",
                    price: "FROM ₹12,500",
                    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Apex+Locator",
                    link: "/shop?category=Endodontics",
                    order: 3,
                    isActive: true
                }
            ];

            const batch = db.batch();
            defaults.forEach(tile => {
                const docRef = db.collection('promotional_tiles').doc(tile.id);
                batch.set(docRef, {
                    title: tile.title,
                    category: tile.category,
                    price: tile.price,
                    image: tile.image,
                    link: tile.link,
                    order: tile.order,
                    isActive: tile.isActive,
                    createdAt: new Date().toISOString()
                });
            });
            await batch.commit();

            // Re-fetch snapshot
            snapshot = await query.get();
        }

        const tiles = snapshot.docs.map(doc => ({ 
            id: isNaN(Number(doc.id)) ? doc.id : Number(doc.id), 
            ...doc.data() 
        }));

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

        // Remove ID from body if passed in updates
        delete cleanUpdates.id;

        await db.collection('promotional_tiles').doc(String(id)).set(cleanUpdates, { merge: true });
        const updatedDoc = await db.collection('promotional_tiles').doc(String(id)).get();

        res.json({ 
            id: isNaN(Number(updatedDoc.id)) ? updatedDoc.id : Number(updatedDoc.id), 
            ...updatedDoc.data() 
        });
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
