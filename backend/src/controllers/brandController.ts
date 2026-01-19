import { Request, Response } from 'express';
import prisma from '../config/database';

export async function getAllBrands(req: Request, res: Response) {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' },
        });
        res.json({ brands });
    } catch (error) {
        throw error;
    }
}
