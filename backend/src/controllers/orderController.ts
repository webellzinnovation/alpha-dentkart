import { Request, Response } from 'express';
import prisma from '../config/database';
import { createOrderSchema } from '../utils/validation';

export async function createOrder(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;
        const validatedData = createOrderSchema.parse(req.body);

        const order = await prisma.order.create({
            data: {
                userId,
                customerName: validatedData.shippingAddress?.name || 'Guest',
                total: validatedData.total,
                items: JSON.stringify(validatedData.items),
                shippingAddress: validatedData.shippingAddress
                    ? JSON.stringify(validatedData.shippingAddress)
                    : null,
                paymentMethod: validatedData.paymentMethod || 'cod',
                status: 'Processing',
            },
        });

        res.status(201).json({ order });
    } catch (error) {
        throw error;
    }
}

export async function getMyOrders(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.userId;

        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        // Parse JSON fields
        const parsedOrders = orders.map(o => ({
            ...o,
            items: JSON.parse(o.items),
            shippingAddress: o.shippingAddress ? JSON.parse(o.shippingAddress) : null,
        }));

        res.json({ orders: parsedOrders });
    } catch (error) {
        throw error;
    }
}
