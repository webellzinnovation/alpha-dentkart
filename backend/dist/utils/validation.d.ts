import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    name: string;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const createOrderSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodNumber;
        name: z.ZodString;
        quantity: z.ZodNumber;
        price: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        productId: number;
        quantity: number;
        price: number;
    }, {
        name: string;
        productId: number;
        quantity: number;
        price: number;
    }>, "many">;
    total: z.ZodNumber;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        email?: string | undefined;
    }, {
        name: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        email?: string | undefined;
    }>>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    paymentId: z.ZodOptional<z.ZodString>;
    transactionId: z.ZodOptional<z.ZodString>;
    signature: z.ZodOptional<z.ZodString>;
    couponId: z.ZodOptional<z.ZodString>;
    couponDiscount: z.ZodOptional<z.ZodNumber>;
    whatsappOptIn: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    items: {
        name: string;
        productId: number;
        quantity: number;
        price: number;
    }[];
    total: number;
    shippingAddress?: {
        name: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        email?: string | undefined;
    } | undefined;
    paymentMethod?: string | undefined;
    paymentId?: string | undefined;
    transactionId?: string | undefined;
    signature?: string | undefined;
    couponId?: string | undefined;
    couponDiscount?: number | undefined;
    whatsappOptIn?: boolean | undefined;
}, {
    items: {
        name: string;
        productId: number;
        quantity: number;
        price: number;
    }[];
    total: number;
    shippingAddress?: {
        name: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        email?: string | undefined;
    } | undefined;
    paymentMethod?: string | undefined;
    paymentId?: string | undefined;
    transactionId?: string | undefined;
    signature?: string | undefined;
    couponId?: string | undefined;
    couponDiscount?: number | undefined;
    whatsappOptIn?: boolean | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map