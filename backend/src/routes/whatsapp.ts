import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import whatsappService from '../services/whatsappService';
import logger from '../utils/logger';

const router = Router();

// Send WhatsApp order confirmation
router.post('/send-order-confirmation', async (req: Request, res: Response) => {
    try {
        const { phone, orderData } = req.body;
        if (!phone || !orderData) {
            return res.status(400).json({ error: 'Phone and orderData required' });
        }
        const result = await whatsappService.sendOrderConfirmation(orderData);
        logger.info('WhatsApp order confirmation sent', { phone, orderId: orderData.id });
        res.json({ success: true, message: 'WhatsApp message generated', waLink: result });
    } catch (error) {
        logger.error('WhatsApp order confirmation error', { error });
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});

// Send WhatsApp shipping update
router.post('/send-shipping-update', async (req: Request, res: Response) => {
    try {
        const { phone, orderData } = req.body;
        if (!phone || !orderData) {
            return res.status(400).json({ error: 'Phone and orderData required' });
        }
        const result = await whatsappService.sendShippingUpdate(orderData);
        res.json({ success: true, waLink: result });
    } catch (error) {
        logger.error('WhatsApp shipping update error', { error });
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});

// Get message history
router.get('/history', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const history = whatsappService.getMessageHistory(limit);
        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get message history' });
    }
});

export default router;
