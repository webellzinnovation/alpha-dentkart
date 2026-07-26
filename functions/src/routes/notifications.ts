import express from 'express';
import { validateBody } from '../middleware/validate';
import { sendNotificationSchema } from '../utils/validation';
import { sendCustomNotification, sendTrackingNotification, sendOrderStatusNotification } from '../controllers/notificationsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All notification routes are admin-only
router.use(authenticateToken, requireAdmin);

// Send custom email
router.post('/send', validateBody(sendNotificationSchema), sendCustomNotification);

// Send tracking notification email
router.post('/tracking', sendTrackingNotification);

// Send order status notification email
router.post('/order-status', sendOrderStatusNotification);

export default router;
