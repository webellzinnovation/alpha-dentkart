"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.createOrderSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.number(),
        name: zod_1.z.string(),
        quantity: zod_1.z.number().min(1),
        price: zod_1.z.number().min(0),
    })),
    total: zod_1.z.number().min(0),
    shippingAddress: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email().optional(),
        street: zod_1.z.string(),
        city: zod_1.z.string(),
        state: zod_1.z.string(),
        zip: zod_1.z.string(),
        phone: zod_1.z.string(),
    }).optional(),
    paymentMethod: zod_1.z.string().optional(),
    paymentId: zod_1.z.string().optional(),
    transactionId: zod_1.z.string().optional(),
    signature: zod_1.z.string().optional(),
    // New fields
    couponId: zod_1.z.string().optional(),
    couponDiscount: zod_1.z.number().optional(),
    whatsappOptIn: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=validation.js.map