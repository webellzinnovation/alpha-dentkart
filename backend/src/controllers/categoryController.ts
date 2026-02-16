import { Request, Response } from 'express';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

export async function getAllCategories(req: Request, res: Response) {
    try {
        const snapshot = await db.collection('categories').orderBy('name', 'asc').get();
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ categories });
    } catch (error) {
        logger.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
}
