import { Request, Response } from 'express';
import prisma from '../config/database';

export async function getAllBrands(req: Request, res: Response) {
    try {
        const { featured } = req.query;
        const where = featured === 'true' ? { isFeatured: true } : {};

        const brands = await prisma.brand.findMany({
            where,
            orderBy: featured === 'true' ? { featuredOrder: 'asc' } : { name: 'asc' },
        });
        res.json({ brands });
    } catch (error) {
        throw error;
    }
}

// Toggle brand featured status
export async function toggleBrandFeatured(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { isFeatured, featuredOrder } = req.body;

        const brand = await prisma.brand.update({
            where: { id: parseInt(id) },
            data: {
                isFeatured,
                ...(featuredOrder !== undefined && { featuredOrder })
            }
        });

        res.json(brand);
    } catch (error) {
        console.error('Error toggling brand featured status:', error);
        res.status(500).json({ error: 'Failed to update brand' });
    }
}

// Reorder featured brands
export async function reorderFeaturedBrands(req: Request, res: Response) {
    try {
        const { brands } = req.body; // Array of { id, featuredOrder }

        const updates = brands.map((brand: { id: number; featuredOrder: number }) =>
            prisma.brand.update({
                where: { id: brand.id },
                data: { featuredOrder: brand.featuredOrder }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Featured brands reordered successfully' });
    } catch (error) {
        console.error('Error reordering featured brands:', error);
        res.status(500).json({ error: 'Failed to reorder brands' });
    }
}

