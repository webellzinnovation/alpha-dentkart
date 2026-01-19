import { Request, Response } from 'express';
import prisma from '../config/database';

export async function getAllCategories(req: Request, res: Response) {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
        res.json({ categories });
    } catch (error) {
        throw error;
    }
}
