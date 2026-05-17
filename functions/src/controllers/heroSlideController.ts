import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

// Get all hero slides (active only for public, all for admin)
export const getAllHeroSlides = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;
        let query: FirebaseFirestore.Query = db.collection('hero_slides').orderBy('order', 'asc');

        if (active === 'true') {
            query = query.where('isActive', '==', true);
        }

        const snapshot = await query.get();
        const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Return in {slides:[]} format matching frontend expectation
        res.json({ slides });
    } catch (error) {
        logger.error('Error fetching hero slides:', error);
        res.status(500).json({ error: 'Failed to fetch hero slides' });
    }
};

// Create new hero slide
export const createHeroSlide = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, image, link, order, isActive, badge, bgClass, gradientClass } = req.body;

        const newSlide = {
            title,
            subtitle,
            image,
            link,
            badge: badge || 'NEW ARRIVAL',
            bgClass: bgClass || 'bg-blue-50 dark:bg-gray-800',
            gradientClass: gradientClass || 'from-blue-50 via-blue-50/80',
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date().toISOString()
        };

        // Firebase Firestore does not accept undefined values
        const cleanSlide = Object.fromEntries(
            Object.entries(newSlide).filter(([_, v]) => v !== undefined)
        );

        const docRef = await db.collection('hero_slides').add(cleanSlide);
        res.status(201).json({ id: docRef.id, ...cleanSlide });
    } catch (error) {
        logger.error('Error creating hero slide:', error);
        res.status(500).json({ error: 'Failed to create hero slide', details: error instanceof Error ? error.message : String(error) });
    }
};

// Update hero slide
export const updateHeroSlide = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        );

        await db.collection('hero_slides').doc(String(id)).update(cleanUpdates);
        const updatedDoc = await db.collection('hero_slides').doc(String(id)).get();

        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error) {
        logger.error('Error updating hero slide:', error);
        res.status(500).json({ error: 'Failed to update hero slide' });
    }
};

// Delete hero slide
export const deleteHeroSlide = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.collection('hero_slides').doc(String(id)).delete();
        res.json({ message: 'Hero slide deleted successfully' });
    } catch (error) {
        logger.error('Error deleting hero slide:', error);
        res.status(500).json({ error: 'Failed to delete hero slide' });
    }
};

// Reorder hero slides
export const reorderHeroSlides = async (req: Request, res: Response) => {
    try {
        const { slides } = req.body; // Array of { id, order }

        const batch = db.batch();
        slides.forEach((slide: { id: string; order: number }) => {
            const ref = db.collection('hero_slides').doc(String(slide.id));
            batch.update(ref, { order: slide.order });
        });
        await batch.commit();

        res.json({ message: 'Hero slides reordered successfully' });
    } catch (error) {
        logger.error('Error reordering hero slides:', error);
        res.status(500).json({ error: 'Failed to reorder hero slides' });
    }
};
