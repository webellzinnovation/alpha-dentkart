import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';

import * as couponController from '../controllers/couponController';

const router = Router();

// Admin routes (authentication required)
router.post('/', authLimiter, (req, res) => couponController.createCoupon(req, res));
router.get('/', authLimiter, (req, res) => couponController.getAllCoupons(req, res));
router.get('/analytics', authLimiter, (req, res) => couponController.getCouponAnalytics(req, res));
router.get('/:id', authLimiter, (req, res) => couponController.getCouponByCode(req, res));
router.put('/:id', authLimiter, (req, res) => couponController.updateCoupon(req, res));
router.delete('/:id', authLimiter, (req, res) => couponController.deleteCoupon(req, res));

// Public routes (no authentication required)
router.post('/validate', authLimiter, (req, res) => couponController.validateCoupon(req, res));
router.post('/apply', authLimiter, (req, res) => couponController.applyCoupon(req, res));

export default router;