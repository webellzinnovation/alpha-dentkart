import { Request, Response } from 'express';
import { z } from 'zod';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

interface CreateCouponRequest {
    code: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    value: number;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    userUsageLimit?: number;
    startsAt: string;
    expiresAt: string;
    applicableProducts?: string;
    applicableCategories?: string;
    userType?: 'all' | 'regular' | 'dental-doctor' | 'student' | 'supplier';
    isActive?: boolean;
}

interface ValidateCouponRequest {
    code: string;
    cartTotal: number;
    userId?: string;
}

interface ApplyCouponRequest {
    code: string;
    cartTotal: number;
    userId?: string;
}

interface Coupon {
    id: string;
    code: string;
    type: string;
    value: number;
    minimumAmount?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    usageCount: number;
    isActive: boolean;
    startsAt: string;
    expiresAt: string;
    applicableProducts?: string;
    applicableCategories?: string;
    userType?: string;
    createdAt: string;
    updatedAt: string;
}

interface UsedCoupon {
    id: string;
    couponId: string;
    userId?: string;
    orderId?: string;
    discountAmount: number;
    createdAt: string;
}

interface CouponValidation {
    success: boolean;
    message: string;
    coupon?: Coupon;
    discountAmount?: number;
    discountedTotal?: number;
    minimumAmount?: number;
    currentAmount?: number;
    usageLimit?: number;
    currentUsage?: number;
    userUsageLimit?: number;
}

interface CouponApplication {
    success: boolean;
    message: string;
    coupon?: Coupon;
    discountAmount?: number;
    discountedTotal?: number;
    usedCouponId?: string;
}

// Simple mock database
let coupons: Coupon[] = [
    {
        id: 'CPN_WELCOME10_001',
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minimumAmount: 500,
        usageLimit: 1000,
        userUsageLimit: 1,
        isActive: true,
        startsAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 6 * 30 * 24 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'CPN_FREESHIP_002',
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minimumAmount: 2000,
        usageLimit: 5000,
        userUsageLimit: 2,
        isActive: true,
        startsAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3 * 30 * 24 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

let usedCoupons: UsedCoupon[] = [];

// Validation schemas
const createCouponSchema = z.object({
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
    userType: z.enum(['all', 'regular', 'dental-doctor', 'student', 'supplier']).optional(),
    isActive: z.boolean().default(true)
});

const validateCouponSchema = z.object({
    code: z.string().min(3, 'Coupon code is required'),
    cartTotal: z.number().min(0, 'Cart total is required')
});

// Helper functions
const findCouponByCode = (code: string): Coupon | null => {
    return coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
};

const canApplyCoupon = (coupon: Coupon, cartTotal: number, userId?: string): boolean => {
    if (!coupon.isActive) return false;
    if (new Date(coupon.expiresAt) < new Date()) return false;
    if (coupon.minimumAmount && cartTotal < coupon.minimumAmount) return false;
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false;
    if (coupon.maximumDiscount) {
        const discountAmount = coupon.type === 'percentage' ? cartTotal * (coupon.value / 100) : coupon.value;
        return discountAmount <= coupon.maximumDiscount;
    }
    if (coupon.userType && userId) {
        // For demo, allow all user types
        return true;
    }
    return true;
};

// Create a new coupon
export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const validation = createCouponSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.errors
            });
        }

        const couponData = validation.data;
        const couponId = `CPN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const coupon: Coupon = {
            id: couponId,
            code: couponData.code!,
            type: couponData.type!,
            value: couponData.value!,
            minimumAmount: couponData.minimumAmount,
            maximumDiscount: couponData.maximumDiscount,
            usageLimit: couponData.usageLimit,
            userUsageLimit: couponData.userUsageLimit,
            usageCount: 0,
            isActive: couponData.isActive !== undefined ? couponData.isActive : true,
            startsAt: couponData.startsAt!,
            expiresAt: couponData.expiresAt!,
            applicableProducts: couponData.applicableProducts,
            applicableCategories: couponData.applicableCategories,
            userType: couponData.userType,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        coupons.push(coupon);

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get all coupons
export const getAllCoupons = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve coupons',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get coupon by code
export const getCouponByCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required'
            });
        }

        const coupon = findCouponByCode(code);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        res.json({
            success: true,
            data: coupon
        });
    } catch (error) {
        console.error('Get coupon by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Update coupon
export const updateCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Coupon ID is required'
            });
        }

        const validation = createCouponSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.errors
            });
        }

        const index = coupons.findIndex(c => c.id === id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        coupons[index] = { ...coupons[index], ...validation.data, updatedAt: new Date().toISOString() };

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            data: coupons[index]
        });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Delete coupon
export const deleteCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Coupon ID is required'
            });
        }

        const index = coupons.findIndex(c => c.id === id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        coupons.splice(index, 1);

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Validate coupon for cart
export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const validation = validateCouponSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.errors
            });
        }

        const { code, cartTotal, userId } = validation.data;

        const coupon = findCouponByCode(code);
        let validationResponse: CouponValidation = {
            success: true,
            coupon,
            discountAmount: 0,
            discountedTotal: cartTotal
        };

        if (!coupon) {
            validationResponse = {
                success: false,
                message: 'Coupon not found or expired'
            };
        } else if (!canApplyCoupon(coupon, cartTotal, userId)) {
            validationResponse = {
                success: false,
                message: coupon.minimumAmount 
                    ? `Minimum order amount of ₹${coupon.minimumAmount} required`
                    : coupon.usageLimit 
                    ? 'Coupon usage limit reached'
                    : coupon.maximumDiscount
                    ? 'Maximum discount amount exceeded'
                    : 'User type restriction',
                minimumAmount: coupon.minimumAmount,
                currentAmount: cartTotal,
                usageLimit: coupon.usageLimit,
                currentUsage: coupon.usageCount,
                userUsageLimit: coupon.userUsageLimit
            };
        }

        if (coupon && canApplyCoupon(coupon, cartTotal, userId)) {
            validationResponse.discountAmount = coupon.type === 'percentage' 
                ? cartTotal * (coupon.value / 100)
                : coupon.type === 'fixed' 
                    ? coupon.value
                    : coupon.type === 'free_shipping' 
                        ? 150 // Example shipping charge
                        : 0;
        }

        validationResponse.discountedTotal = cartTotal - validationResponse.discountAmount;

        res.json(validationResponse);
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Apply coupon to cart
export const applyCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const validation = validateCouponSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.errors
            });
        }

        const { code, cartTotal, userId } = validation.data;

        const coupon = findCouponByCode(code);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found or expired'
            });
        }

        const discountAmount = coupon.type === 'percentage' 
            ? cartTotal * (coupon.value / 100)
            : coupon.type === 'fixed' 
                ? coupon.value
                : coupon.type === 'free_shipping' 
                    ? 150 // Example shipping charge
                    : 0;

        const usedCoupon: UsedCoupon = userId ? {
            id: `UC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            couponId: coupon.id,
            userId,
            orderId: null, // Will be set when order is created
            discountAmount,
            createdAt: new Date().toISOString()
        } : null;

        if (userId) {
            usedCoupons.push(usedCoupon);
        }

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            data: {
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    type: coupon.type,
                    value: coupon.value,
                    description: coupon.type === 'percentage' 
                        ? `${coupon.value}% discount` 
                        : coupon.type === 'fixed' 
                            ? `₹${coupon.value} off` 
                            : coupon.type === 'free_shipping' 
                                ? 'Free shipping' 
                                : `${coupon.value} discount`
                },
                discountAmount,
                discountedTotal: cartTotal - discountAmount,
                usedCouponId: usedCoupon?.id
            }
        });
    } catch (error) {
        console.error('Apply coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};