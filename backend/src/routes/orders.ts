import { Router } from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.post('/', authenticateToken, createOrder);
router.get('/me', authenticateToken, getMyOrders);

export default router;
