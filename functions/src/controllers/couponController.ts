import { Request, Response } from 'express';
import { db, admin } from '../config/firebase'; // Firestore
import { z } from 'zod';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

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
    userType: z.string().optional(),
    isActive: z.boolean().default(true)
});

const validateCouponSchema = z.object({
    code: z.string().min(3, 'Coupon code is required'),
    cartTotal: z.number().min(0, 'Cart total is required'),
    userId: z.string().optional()
});

// Create a new coupon
export const createCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Auth check (middleware should handle, but double check role)
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const validation = createCouponSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: validation.error.issues
            });
        }

        const couponData = validation.data;

        // Check if code exists
        const couponsRef = db.collection('coupons');
        const snapshot = await couponsRef.where('code', '==', couponData.code).limit(1).get();

        if (!snapshot.empty) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        // Create
        const newCoupon = {
            ...couponData,
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await couponsRef.add(newCoupon);

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: { id: docRef.id, ...newCoupon }
        });
    } catch (error) {
        logger.error('Create coupon error:', error);
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
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const snapshot = await db.collection('coupons').orderBy('createdAt', 'desc').get();
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({
            success: true,
            data: coupons
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve coupons' });
    }
};

// Get coupon by code
export const getCouponByCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        if (!code) return res.status(400).json({ success: false, message: 'Code required' });

        const snapshot = await db.collection('coupons').where('code', '==', code).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        res.json({ success: true, data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve coupon' });
    }
};

// Update coupon
export const updateCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { id } = req.params;
        const validation = createCouponSchema.partial().safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({ success: false, errors: validation.error.issues });
        }

        await db.collection('coupons').doc(String(id)).update({
            ...validation.data,
            updatedAt: new Date().toISOString()
        });

        // Fetch updated
        const doc = await db.collection('coupons').doc(String(id)).get();

        res.json({ success: true, message: 'Coupon updated', data: { id: doc.id, ...doc.data() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update coupon' });
    }
};

// Delete coupon
export const deleteCoupon = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = (req as any).user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const { id } = req.params;
        await db.collection('coupons').doc(String(id)).delete();

        res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete coupon' });
    }
};

// Validate coupon logic
const validateCouponLogic = async (code: string, cartTotal: number, userId?: string) => {
    const snapshot = await db.collection('coupons').where('code', '==', code).limit(1).get();

    if (snapshot.empty) {
        return { valid: false, message: 'Coupon not found' };
    }

    const doc = snapshot.docs[0];
    const foundCoupon = { id: doc.id, ...doc.data() } as any;

    // Checks
    if (!foundCoupon.isActive) return { valid: false, message: 'Coupon is inactive' };
    if (new Date() > new Date(foundCoupon.expiresAt)) return { valid: false, message: 'Coupon expired' };
    if (new Date() < new Date(foundCoupon.startsAt)) return { valid: false, message: 'Coupon not started yet' };
    if (foundCoupon.minimumAmount && cartTotal < foundCoupon.minimumAmount) {
        return { valid: false, message: `Minimum order amount of ${foundCoupon.minimumAmount} required` };
    }
    if (foundCoupon.usageLimit && (foundCoupon.usageCount || 0) >= foundCoupon.usageLimit) {
        return { valid: false, message: 'Coupon usage limit reached' };
    }

    // Check user usage limit if userId provided
    if (userId && foundCoupon.userUsageLimit) {
        const usedSnapshot = await db.collection('used_coupons')
            .where('couponId', '==', foundCoupon.id)
            .where('userId', '==', userId)
            .get();

        if (usedSnapshot.size >= foundCoupon.userUsageLimit) {
            return { valid: false, message: 'You have exceeded the usage limit for this coupon' };
        }
    }

    // Calculate discount
    let discount = 0;
    if (foundCoupon.type === 'percentage') {
        discount = (cartTotal * foundCoupon.value) / 100;
        if (foundCoupon.maximumDiscount && discount > foundCoupon.maximumDiscount) {
            discount = foundCoupon.maximumDiscount;
        }
    } else if (foundCoupon.type === 'fixed') {
        discount = foundCoupon.value;
    } else if (foundCoupon.type === 'free_shipping') {
        discount = 0;
    }

    return {
        valid: true,
        coupon: foundCoupon,
        discountAmount: discount
    };
};

export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code, cartTotal, userId } = validateCouponSchema.parse(req.body);

        const result = await validateCouponLogic(code, cartTotal, userId);

        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.json({
            success: true,
            coupon: result.coupon,
            discountAmount: result.discountAmount,
            discountedTotal: cartTotal - (result.discountAmount || 0)
        });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ success: false, errors: error.issues });
        res.status(500).json({ success: false, message: 'Validation failed' });
    }
};

export const applyCoupon = async (req: AuthenticatedRequest, res: Response) => {
    return validateCoupon(req, res);
};

// Get coupon analytics (admin only)
export const getCouponAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }

        const snapshot = await db.collection('coupons').get();
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

        const totalCoupons = coupons.length;
        const activeCoupons = coupons.filter(c => c.isActive).length;
        const totalUsage = coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0);

        // Mock trends
        const usageTrends = [
            { date: new Date().toISOString().split('T')[0], count: totalUsage }
        ];

        res.json({
            success: true,
            analytics: {
                totalCoupons,
                activeCoupons,
                totalUsage,
                usageTrends
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};