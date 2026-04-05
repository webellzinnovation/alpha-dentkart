import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { cacheService } from '../services/cacheService';
import logger from '../utils/logger';

export async function getAllCategories(req: Request, res: Response) {
    try {
        const categories = await cacheService.getCategories();
        res.json({ categories });
    } catch (error: any) {
        logger.error('Error fetching categories:', error);
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
        await cacheService.invalidateCategoriesCache();

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        logger.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}
