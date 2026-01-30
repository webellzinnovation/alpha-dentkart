import { Router } from 'express';
import { 
    createShipment, 
    trackShipment, 
    getShippingRates,
    checkPincodeServiceability,
    getUserOrderTracking,
    getAllShipments
} from '../controllers/shippingController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Protected routes
router.post('/create', authenticateToken, authLimiter, createShipment);
router.get('/track/:trackingId', authenticateToken, trackShipment);
router.post('/rates', authenticateToken, getShippingRates);
router.get('/pincode/:pincode', checkPincodeServiceability);

// User order tracking
router.get('/order/:orderId', authenticateToken, getUserOrderTracking);

// Admin routes
router.get('/admin/all', authenticateToken, getAllShipments);

export default router;