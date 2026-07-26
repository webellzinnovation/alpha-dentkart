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

// Product Schemas
export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    category: z.string().min(1, 'Category is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    originalPrice: z.number().min(0).optional(),
    brand: z.string().optional(),
    description: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    weight: z.string().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Category Schemas
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z.string().optional(),
    image: z.string().optional(),
    iconClass: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Brand Schemas
export const createBrandSchema = z.object({
    name: z.string().min(1, 'Brand name is required'),
    logo: z.string().optional(),
    description: z.string().optional(),
    isFeatured: z.boolean().optional(),
    featuredOrder: z.number().int().optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

// Order Update Schema
export const updateOrderSchema = z.object({
    status: z.enum(['Pending Payment', 'Payment Failed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Initiated', 'Return Approved', 'Return Completed', 'Return Rejected']).optional(),
    trackingNumber: z.string().optional(),
    courierName: z.string().optional(),
    estimatedDelivery: z.string().optional(),
    notes: z.string().optional(),
});

// AI Schemas
export const aiPromptSchema = z.object({
    message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
    sessionId: z.string().optional(),
    context: z.string().optional(),
});

// PhonePe Schemas
export const phonepeInitSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    amount: z.number().min(1, 'Amount must be positive'),
    customerPhone: z.string().optional(),
    redirectUrl: z.string().url().optional(),
});

// Verification Schemas
export const verificationSubmitSchema = z.object({
    documentType: z.enum(['license', 'student_id', 'gst_certificate', 'business_registration']),
    documentNumber: z.string().min(1, 'Document number is required'),
    notes: z.string().optional(),
});

export const verificationReviewSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    reviewNotes: z.string().optional(),
});

// Settings Schemas
export const updateSettingsSchema = z.object({
    storeName: z.string().optional(),
    storeEmail: z.string().email().optional(),
    storePhone: z.string().optional(),
    storeLogo: z.string().optional(),
    currency: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    freeShippingThreshold: z.number().min(0).optional(),
    payment: z.object({
        razorpay: z.object({
            keyId: z.string().optional(),
            keySecret: z.string().optional(),
            enabled: z.boolean().optional(),
        }).optional(),
        cod: z.object({
            enabled: z.boolean().optional(),
        }).optional(),
    }).optional(),
}).passthrough();

// Quick Reorder Schema
export const quickReorderSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    items: z.array(z.object({
        productId: z.union([z.string(), z.number()]),
        quantity: z.number().int().min(1),
    })).optional(),
});

// Saved Payment Schemas
export const savePaymentMethodSchema = z.object({
    type: z.enum(['card', 'upi', 'netbanking']),
    token: z.string().min(1, 'Payment token is required'),
    lastFour: z.string().length(4).optional(),
    cardBrand: z.string().optional(),
    upiId: z.string().optional(),
    isDefault: z.boolean().optional(),
});

// Hero Slide Schemas
export const heroSlideSchema = z.object({
    badge: z.string().min(1, 'Badge text is required'),
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().min(1, 'Subtitle is required'),
    image: z.string().min(1, 'Image is required'),
    bgClass: z.string().optional().default(''),
    gradientClass: z.string().optional().default(''),
    link: z.object({
        type: z.enum(['product', 'category', 'brand', 'url']),
        value: z.union([z.string(), z.number()]),
    }).optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional().default(true),
});

// Promotional Tile Schemas
export const promotionalTileSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    price: z.string().min(1, 'Price is required'),
    image: z.string().min(1, 'Image is required'),
    link: z.string().min(1, 'Link is required'),
    badge: z.string().optional(),
    badgeColor: z.string().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional().default(true),
});

// Delivery Estimation Schema
export const deliveryEstimationSchema = z.object({
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
    productIds: z.array(z.union([z.string(), z.number()])).optional(),
});

// Chat Session Schemas
export const createChatMessageSchema = z.object({
    text: z.string().min(1, 'Message cannot be empty').max(5000),
    sessionId: z.string().optional(),
});

// Notification Schemas
export const sendNotificationSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Body is required'),
    topic: z.string().optional(),
    userId: z.string().optional(),
    data: z.record(z.string(), z.string()).optional(),
});

// Shiprocket Schemas
export const createShipmentSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    length: z.number().min(0.1).optional(),
    width: z.number().min(0.1).optional(),
    height: z.number().min(0.1).optional(),
    weight: z.number().min(0.1).optional(),
});

// Admin Stats Query Schema
export const adminStatsQuerySchema = z.object({
    period: z.enum(['today', 'week', 'month', 'year', 'all']).optional().default('month'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// Shipping Rate Schema (used by shippingController)
export const shippingRateRequestSchema = z.object({
    pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
    weight: z.number().min(0.01, 'Weight must be positive').optional(),
    total: z.number().min(0).optional(),
});
