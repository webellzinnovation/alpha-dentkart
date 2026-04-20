import { Router } from 'express';
import { createOrder, getMyOrders, getAllOrders, handleCreateRazorpayOrder, updateOrderStatus } from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizeInput } from '../middleware/sanitize';

const router = Router();

// All order routes require authentication (rate limited, sanitized)
router.post('/', authLimiter, sanitizeInput, authenticateToken, createOrder);
router.post('/create-razorpay-order', authLimiter, sanitizeInput, authenticateToken, handleCreateRazorpayOrder);
router.get('/me', authenticateToken, getMyOrders);

// Admin only routes (rate limited, sanitized)
router.get('/all', authenticateToken, requireAdmin, getAllOrders);
router.put('/:id/status', authLimiter, sanitizeInput, authenticateToken, requireAdmin, updateOrderStatus);

export default router;
