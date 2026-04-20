import { Router } from 'express';
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder, createRazorpayOrder } from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizeInput } from '../middleware/sanitize';

const router = Router();

// User routes (rate limited, sanitized)
router.post('/', authLimiter, sanitizeInput, authenticateToken, createOrder);
router.get('/me', authenticateToken, getMyOrders);

// Razorpay: create server-side order before payment (rate limited, sanitized)
router.post('/razorpay-order', authLimiter, sanitizeInput, authenticateToken, createRazorpayOrder);

// Admin routes — all protected (rate limited, sanitized)
router.get('/all', authenticateToken, requireAdmin, getAllOrders);
router.patch('/:id/status', authLimiter, sanitizeInput, authenticateToken, requireAdmin, updateOrderStatus);
router.delete('/:id', authLimiter, sanitizeInput, authenticateToken, requireAdmin, deleteOrder);

export default router;
