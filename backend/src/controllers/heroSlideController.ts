import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all hero slides (active only for public, all for admin)
export const getAllHeroSlides = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;
        const where = active === 'true' ? { isActive: true } : {};

        const slides = await prisma.heroSlide.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        res.json(slides);
    } catch (error) {
        console.error('Error fetching hero slides:', error);
        res.status(500).json({ error: 'Failed to fetch hero slides' });
    }
};

// Create new hero slide
export const createHeroSlide = async (req: Request, res: Response) => {
    try {
        const { title, subtitle, image, link, order, isActive } = req.body;

        const slide = await prisma.heroSlide.create({
            data: {
                title,
                subtitle,
                image,
                link,
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json(slide);
    } catch (error) {
        console.error('Error creating hero slide:', error);
        res.status(500).json({ error: 'Failed to create hero slide' });
    }
};

// Update hero slide
export const updateHeroSlide = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, subtitle, image, link, order, isActive } = req.body;

        const slide = await prisma.heroSlide.update({
            where: { id: parseInt(id) },
            data: {
                ...(title !== undefined && { title }),
                ...(subtitle !== undefined && { subtitle }),
                ...(image !== undefined && { image }),
                ...(link !== undefined && { link }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive })
            }
        });

        res.json(slide);
    } catch (error) {
        console.error('Error updating hero slide:', error);
        res.status(500).json({ error: 'Failed to update hero slide' });
    }
};

// Delete hero slide
export const deleteHeroSlide = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.heroSlide.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Hero slide deleted successfully' });
    } catch (error) {
        console.error('Error deleting hero slide:', error);
        res.status(500).json({ error: 'Failed to delete hero slide' });
    }
};

// Reorder hero slides
export const reorderHeroSlides = async (req: Request, res: Response) => {
    try {
        const { slides } = req.body; // Array of { id, order }

        const updates = slides.map((slide: { id: number; order: number }) =>
            prisma.heroSlide.update({
                where: { id: slide.id },
                data: { order: slide.order }
            })
        );

        await prisma.$transaction(updates);

        res.json({ message: 'Hero slides reordered successfully' });
    } catch (error) {
        console.error('Error reordering hero slides:', error);
        res.status(500).json({ error: 'Failed to reorder hero slides' });
    }
};
