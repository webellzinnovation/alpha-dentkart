import { Router } from 'express';
import { 
    cancelOrder,
    bulkCancelOrders,
    getCancellationReasons,
    getOrderCancellationHistory,
    getOrderForCancellation
} from '../controllers/orderCancellationController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Protected routes (authentication required)
router.post('/cancel/:orderId', authLimiter, cancelOrder);
router.post('/bulk-cancel', authLimiter, bulkCancelOrders);
router.get('/reasons', authLimiter, getCancellationReasons);
router.get('/history', authLimiter, getOrderCancellationHistory);
router.get('/check/:orderId', authLimiter, getOrderForCancellation);

export default router;