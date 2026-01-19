import { Request, Response } from 'express';
import prisma from '../config/database';

export async function getAllProducts(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
        const brandId = req.query.brandId ? parseInt(req.query.brandId as string) : undefined;
        const search = req.query.search as string;

        const where: any = {};
        if (categoryId) where.categoryId = categoryId;
        if (brandId) where.brandId = brandId;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { description: { contains: search } }
            ];
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: true,
                    brand: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where })
        ]);

        // Parse JSON fields
        const parsedProducts = products.map(p => ({
            ...p,
            images: p.images ? JSON.parse(p.images) : [],
            features: p.features ? JSON.parse(p.features) : [],
            specs: p.specs ? JSON.parse(p.specs) : {},
            attributes: p.attributes ? JSON.parse(p.attributes) : [],
            variations: p.variations ? JSON.parse(p.variations) : [],
        }));

        res.json({
            products: parsedProducts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        throw error;
    }
}

export async function getProductById(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                brand: true,
            },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Parse JSON fields
        const parsedProduct = {
            ...product,
            images: product.images ? JSON.parse(product.images) : [],
            features: product.features ? JSON.parse(product.features) : [],
            specs: product.specs ? JSON.parse(product.specs) : {},
            attributes: product.attributes ? JSON.parse(product.attributes) : [],
            variations: product.variations ? JSON.parse(product.variations) : [],
        };

        res.json({ product: parsedProduct });
    } catch (error) {
        throw error;
    }
}
