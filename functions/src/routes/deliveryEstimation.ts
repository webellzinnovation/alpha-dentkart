import express from 'express';
import {
  calculateDeliveryEstimation,
  getDeliveryHistory,
  getDeliveryAnalytics,
  checkPincodeServiceability,
  getShippingCost,
  getCartDeliveryEstimate
} from '../controllers/deliveryEstimationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/check-pincode', checkPincodeServiceability);

// Authenticated routes
router.post('/calculate', authenticateToken, calculateDeliveryEstimation);
router.post('/cart-estimate', authenticateToken, getCartDeliveryEstimate);
router.post('/shipping-cost', authenticateToken, getShippingCost);
router.get('/history', authenticateToken, getDeliveryHistory);
router.get('/analytics', authenticateToken, getDeliveryAnalytics);

export default router;