import { z } from 'zod';

const passwordRequirements = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: passwordRequirements,
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    userType: z.enum(['regular', 'dental-doctor', 'dental-student', 'dental-business']).default('regular'),
    // Dental Doctor Information
    dentalDoctorInfo: z.object({
        licenseId: z.string(),
        licenseState: z.string(),
        specialization: z.string().optional(),
        clinicName: z.string().optional(),
    }).optional(),
    // Student Information
    dentalStudentInfo: z.object({
        institution: z.string(),
        studentId: z.string(),
        expectedGraduation: z.string().optional(),
    }).optional(),
    // Business Information
    dentalBusinessInfo: z.object({
        businessName: z.string(),
        gstNumber: z.string(),
        businessType: z.string().optional(),
    }).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordRequirements,
});

export const userUpdateSchema = z.object({
    name: z.string().min(2, 'Name is too short').optional(),
    phone: z.string().optional(),
    userType: z.enum(['dental-doctor', 'dental-student', 'dental-business', 'regular']).optional(),
    verificationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    status: z.enum(['Active', 'Inactive', 'Suspended']).optional(),
    dentalDoctorInfo: z.object({
        licenseId: z.string().optional(),
        licenseState: z.string().optional(),
        specialization: z.string().optional(),
        clinicName: z.string().optional(),
    }).optional(),
    dentalStudentInfo: z.object({
        institution: z.string().optional(),
        studentId: z.string().optional(),
        expectedGraduation: z.string().optional(),
    }).optional(),
    dentalBusinessInfo: z.object({
        businessName: z.string().optional(),
        gstNumber: z.string().optional(),
        businessType: z.string().optional(),
    }).optional(),
}).strict();

// Coupon Schemas
export const createCouponSchema = z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters').max(20, 'Coupon code must not exceed 20 characters'),
    type: z.enum(['percentage', 'fixed', 'free_shipping']),
    value: z.number().min(0, 'Value must be non-negative'),
    minimumAmount: z.number().min(0, 'Minimum amount must be non-negative').optional(),
    maximumDiscount: z.number().min(0, 'Maximum discount must be non-negative').optional(),
    usageLimit: z.number().min(1, 'Usage limit must be at least 1').optional(),
    userUsageLimit: z.number().min(1, 'User usage limit must be at least 1').optional(),
    startsAt: z.string().datetime('Invalid start date format'),
    expiresAt: z.string().datetime('Invalid expiry date format'),
    applicableProducts: z.string().optional(),
    applicableCategories: z.string().optional(),
    userType: z.string().optional(),
    isActive: z.boolean().default(true)
});

export const validateCouponSchema = z.object({
    code: z.string().min(3, 'Coupon code is required'),
    cartTotal: z.number().min(0, 'Cart total is required'),
    userId: z.string().optional()
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
        email: z.string().email().optional(),
    }).optional(),
    customerEmail: z.string().email().optional(),
    paymentMethod: z.string().optional(),
    paymentId: z.string().optional(),
    transactionId: z.string().optional(),
    signature: z.string().optional(),
    couponId: z.string().optional(),
    couponDiscount: z.number().optional(),
    whatsappOptIn: z.boolean().optional(),
});
