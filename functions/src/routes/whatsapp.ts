import express from 'express';
import { sendOrderStatusWhatsApp, sendCustomWhatsApp, sendPaymentReminderWhatsApp } from '../controllers/whatsappController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All WhatsApp routes require authentication
router.use(authenticateToken);

// Send order status via WhatsApp (Admin only)
router.post('/order-status', requireAdmin, sendOrderStatusWhatsApp);

// Send custom WhatsApp message (Admin only)
router.post('/send', requireAdmin, sendCustomWhatsApp);

// Send payment reminder via WhatsApp (Admin only)
router.post('/payment-reminder', requireAdmin, sendPaymentReminderWhatsApp);

export default router;
