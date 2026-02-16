import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const createOrderSchema = z.object({
    items: z.array(z.object({
        productId: z.number(),
        name: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
    })),
    total: z.number().min(0),
    shippingAddress: z.object({
        name: z.string(),
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zip: z.string(),
        phone: z.string(),
    }).optional(),
    paymentMethod: z.string().optional(),
    paymentId: z.string().optional(),
    transactionId: z.string().optional(),
    signature: z.string().optional(),
    // New fields
    couponId: z.string().optional(),
    couponDiscount: z.number().optional(),
    whatsappOptIn: z.boolean().optional(),
});
