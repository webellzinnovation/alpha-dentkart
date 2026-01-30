import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all promotional tiles (active only for public, all for admin)
export const getAllPromotionalTiles = async (req: Request, res: Response) => {
    try {
        const { active, limit } = req.query;
        const where = active === 'true' ? { isActive: true } : {};

        const tiles = await prisma.promotionalTile.findMany({
            where,
            orderBy: { order: 'asc' },
            ...(limit && { take: parseInt(limit as string) })
        });

        res.json(tiles);
    } catch (error) {
        console.error('Error fetching promotional tiles:', error);
        res.status(500).json({ error: 'Failed to fetch promotional tiles' });
    }
};

// Create new promotional tile
export const createPromotionalTile = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, category, price, image, link, badge, badgeColor, order, isActive } = req.body;

        const tile = await prisma.promotionalTile.create({
            data: {
                title,
                subtitle,
                category,
                price,
                image,
                link,
                badge,
                badgeColor,
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json(tile);
    } catch (error) {
        console.error('Error creating promotional tile:', error);
        res.status(500).json({ error: 'Failed to create promotional tile' });
    }
};

// Update promotional tile
export const updatePromotionalTile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, subtitle, category, price, image, link, badge, badgeColor, order, isActive } = req.body;

        const tile = await prisma.promotionalTile.update({
            where: { id: parseInt(id) },
            data: {
                ...(title !== undefined && { title }),
                ...(subtitle !== undefined && { subtitle }),
                ...(category !== undefined && { category }),
                ...(price !== undefined && { price }),
                ...(image !== undefined && { image }),
                ...(link !== undefined && { link }),
                ...(badge !== undefined && { badge }),
                ...(badgeColor !== undefined && { badgeColor }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(tile);
    } catch (error) {
        console.error('Error updating promotional tile:', error);
        res.status(500).json({ error: 'Failed to update promotional tile' });
    }
};

// Delete promotional tile
export const deletePromotionalTile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.promotionalTile.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Promotional tile deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotional tile:', error);
        res.status(500).json({ error: 'Failed to delete promotional tile' });
    }
};

// Reorder promotional tiles
export const reorderPromotionalTiles = async (req: Request, res: Response) => {
    try {
        const { tiles } = req.body; // Array of { id, order }

        const updates = tiles.map((tile: { id: number; order: number }) =>
            prisma.promotionalTile.update({
                where: { id: tile.id },
                data: { order: tile.order }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Promotional tiles reordered successfully' });
    } catch (error) {
        console.error('Error reordering promotional tiles:', error);
        res.status(500).json({ error: 'Failed to reorder promotional tiles' });
    }
};
