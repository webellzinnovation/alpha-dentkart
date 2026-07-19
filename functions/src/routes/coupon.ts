import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken, requireAdmin } from '../middleware/auth';

import * as couponController from '../controllers/couponController';

const router = Router();

// Admin routes (authentication required)
router.post('/', authLimiter, authenticateToken, requireAdmin, (req, res) => couponController.createCoupon(req, res));
router.get('/', authLimiter, authenticateToken, requireAdmin, (req, res) => couponController.getAllCoupons(req, res));
router.get('/analytics', authLimiter, authenticateToken, requireAdmin, (req, res) => couponController.getCouponAnalytics(req, res));
router.get('/:id', authLimiter, authenticateToken, requireAdmin, (req, res) => couponController.getCouponByCode(req, res));
router.put('/:id', authLimiter, authenticateToken, requireAdmin, (req, res) => couponController.updateCoupon(req, res));
router.delete('/:id', authLimiter, authenticateToken, requireAdmin, (req, res) => couponController.deleteCoupon(req, res));

// Public routes (no authentication required)
router.post('/validate', authLimiter, (req, res) => couponController.validateCoupon(req, res));
router.post('/apply', authLimiter, (req, res) => couponController.applyCoupon(req, res));

export default router;