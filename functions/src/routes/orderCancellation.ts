import { Router } from 'express';
import {
    cancelOrder,
    bulkCancelOrders,
    getCancellationReasons,
    getOrderCancellationHistory,
    getOrderForCancellation
} from '../controllers/orderCancellationController';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protected routes (authentication required)
router.post('/cancel/:orderId', authenticateToken, authLimiter, cancelOrder);
router.post('/bulk-cancel', authenticateToken, authLimiter, bulkCancelOrders);
router.get('/reasons', authenticateToken, authLimiter, getCancellationReasons);
router.get('/history', authenticateToken, authLimiter, getOrderCancellationHistory);
router.get('/check/:orderId', authenticateToken, authLimiter, getOrderForCancellation);

export default router;