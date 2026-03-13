import { Router } from 'express';
import { createOrder, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder, createRazorpayOrder } from '../controllers/orderController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// User routes
router.post('/', authenticateToken, createOrder);
router.get('/me', authenticateToken, getMyOrders);

// Razorpay: create server-side order before payment
router.post('/razorpay-order', authenticateToken, createRazorpayOrder);

// Admin routes — all protected
router.get('/all', authenticateToken, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteOrder);

export default router;
