import { Router } from 'express';
import { 
    createGuestSession,
    validateGuestSession,
    createGuestOrder,
    getGuestOrder,
    updateGuestOrder,
    getGuestOrderStatus,
    convertGuestOrder,
    getGuestOrders
} from '../controllers/guestCheckoutController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (no authentication required)
router.post('/session/create', authLimiter, createGuestSession);
router.get('/session/validate/:sessionId', authLimiter, validateGuestSession);
router.post('/order/create', authLimiter, createGuestOrder);
router.get('/order/:orderId', authLimiter, getGuestOrder);
router.put('/order/:orderId', authLimiter, updateGuestOrder);
router.get('/order/:orderId/status', authLimiter, getGuestOrderStatus);
router.get('/session/:sessionId/orders', authLimiter, getGuestOrders);

// Protected routes (authentication required)
// These would be used when guest wants to create account after checkout
router.post('/order/:orderId/convert', convertGuestOrder);

export default router;