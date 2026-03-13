import express from 'express';
import { sendCustomNotification, sendTrackingNotification, sendOrderStatusNotification } from '../controllers/notificationsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All notification routes are admin-only
router.use(authenticateToken, requireAdmin);

// Send custom email
router.post('/send', sendCustomNotification);

// Send tracking notification email
router.post('/tracking', sendTrackingNotification);

// Send order status notification email
router.post('/order-status', sendOrderStatusNotification);

export default router;
