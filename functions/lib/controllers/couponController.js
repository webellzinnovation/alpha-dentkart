"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCouponAnalytics = exports.applyCoupon = exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.getCouponByCode = exports.getAllCoupons = exports.createCoupon = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
// Validation schemas
const createCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(3, 'Coupon code must be at least 3 characters').max(20, 'Coupon code must not exceed 20 characters'),
    type: zod_1.z.enum(['percentage', 'fixed', 'free_shipping']),
    value: zod_1.z.number().min(0, 'Value must be non-negative'),
    minimumAmount: zod_1.z.number().min(0, 'Minimum amount must be non-negative').optional(),
    maximumDiscount: zod_1.z.number().min(0, 'Maximum discount must be non-negative').optional(),
    usageLimit: zod_1.z.number().min(1, 'Usage limit must be at least 1').optional(),
    userUsageLimit: zod_1.z.number().min(1, 'User usage limit must be at least 1').optional(),
    startsAt: zod_1.z.string().datetime('Invalid start date format'),
    expiresAt: zod_1.z.string().datetime('Invalid expiry date format'),
    applicableProducts: zod_1.z.string().optional(),
    applicableCategories: zod_1.z.string().optional(),
    userType: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true)
});
const validateCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(3, 'Coupon code is required'),
    cartTotal: zod_1.z.number().min(0, 'Cart total is required'),
    userId: zod_1.z.string().optional()
});
// Create a new coupon
const createCoupon = async (req, res) => {
    try {
        // Auth check (middleware should handle, but double check role)
        const user = req.user;
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
        const couponsRef = firebase_1.db.collection('coupons');
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
    }
    catch (error) {
        logger_1.default.error('Create coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createCoupon = createCoupon;
// Get all coupons
const getAllCoupons = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        const snapshot = await firebase_1.db.collection('coupons').orderBy('createdAt', 'desc').get();
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({
            success: true,
            data: coupons
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve coupons' });
    }
};
exports.getAllCoupons = getAllCoupons;
// Get coupon by code
const getCouponByCode = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code)
            return res.status(400).json({ success: false, message: 'Code required' });
        const snapshot = await firebase_1.db.collection('coupons').where('code', '==', code).limit(1).get();
        if (snapshot.empty) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        res.json({ success: true, data: coupon });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve coupon' });
    }
};
exports.getCouponByCode = getCouponByCode;
// Update coupon
const updateCoupon = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        const { id } = req.params;
        const validation = createCouponSchema.partial().safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ success: false, errors: validation.error.issues });
        }
        await firebase_1.db.collection('coupons').doc(String(id)).update({
            ...validation.data,
            updatedAt: new Date().toISOString()
        });
        // Fetch updated
        const doc = await firebase_1.db.collection('coupons').doc(String(id)).get();
        res.json({ success: true, message: 'Coupon updated', data: { id: doc.id, ...doc.data() } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update coupon' });
    }
};
exports.updateCoupon = updateCoupon;
// Delete coupon
const deleteCoupon = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        const { id } = req.params;
        await firebase_1.db.collection('coupons').doc(String(id)).delete();
        res.json({ success: true, message: 'Coupon deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete coupon' });
    }
};
exports.deleteCoupon = deleteCoupon;
// Validate coupon logic
const validateCouponLogic = async (code, cartTotal, userId) => {
    const snapshot = await firebase_1.db.collection('coupons').where('code', '==', code).limit(1).get();
    if (snapshot.empty) {
        return { valid: false, message: 'Coupon not found' };
    }
    const doc = snapshot.docs[0];
    const foundCoupon = { id: doc.id, ...doc.data() };
    // Checks
    if (!foundCoupon.isActive)
        return { valid: false, message: 'Coupon is inactive' };
    if (new Date() > new Date(foundCoupon.expiresAt))
        return { valid: false, message: 'Coupon expired' };
    if (new Date() < new Date(foundCoupon.startsAt))
        return { valid: false, message: 'Coupon not started yet' };
    if (foundCoupon.minimumAmount && cartTotal < foundCoupon.minimumAmount) {
        return { valid: false, message: `Minimum order amount of ${foundCoupon.minimumAmount} required` };
    }
    if (foundCoupon.usageLimit && (foundCoupon.usageCount || 0) >= foundCoupon.usageLimit) {
        return { valid: false, message: 'Coupon usage limit reached' };
    }
    // Check user usage limit if userId provided
    if (userId && foundCoupon.userUsageLimit) {
        const usedSnapshot = await firebase_1.db.collection('used_coupons')
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
    }
    else if (foundCoupon.type === 'fixed') {
        discount = foundCoupon.value;
    }
    else if (foundCoupon.type === 'free_shipping') {
        discount = 0;
    }
    return {
        valid: true,
        coupon: foundCoupon,
        discountAmount: discount
    };
};
const validateCoupon = async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ success: false, errors: error.issues });
        res.status(500).json({ success: false, message: 'Validation failed' });
    }
};
exports.validateCoupon = validateCoupon;
const applyCoupon = async (req, res) => {
    return (0, exports.validateCoupon)(req, res);
};
exports.applyCoupon = applyCoupon;
// Get coupon analytics (admin only)
const getCouponAnalytics = async (req, res) => {
    try {
        const user = req.user;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        const snapshot = await firebase_1.db.collection('coupons').get();
        const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};
exports.getCouponAnalytics = getCouponAnalytics;
//# sourceMappingURL=couponController.js.map