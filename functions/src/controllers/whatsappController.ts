import { Request, Response } from 'express';
import WhatsAppService from '../services/whatsappService';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const sendOrderStatusWhatsApp = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { phone, orderId, customerName, status, trackingProvider, trackingNumber, trackingUrl, total } = req.body;

        if (!phone || !orderId || !status) {
            return res.status(400).json({ error: 'Missing required fields: phone, orderId, status' });
        }

        const orderData = {
            customerPhone: phone,
            customerName: customerName || 'Customer',
            orderId,
            trackingProvider,
            trackingNumber,
            trackingUrl,
            total: parseFloat(total) || 0,
            reason: req.body.reason
        };

        let result;
        
        switch (status) {
            case 'Processing':
                result = await WhatsAppService.sendOrderConfirmation(orderData);
                break;
            case 'Shipped':
                result = await WhatsAppService.sendShippingUpdate(orderData);
                break;
            case 'Delivered':
                result = await WhatsAppService.sendDeliveryConfirmation(orderData);
                break;
            case 'Cancelled':
                result = await WhatsAppService.sendOrderCancellation(orderData);
                break;
            default:
                return res.status(400).json({ error: 'Invalid status. Use: Processing, Shipped, Delivered, or Cancelled' });
        }

        res.json({ 
            success: result.status === 'sent', 
            message: result.status === 'sent' ? 'WhatsApp notification sent' : 'Failed to send WhatsApp notification',
            notificationId: result.id,
            error: result.error
        });

    } catch (error: any) {
        logger.error('WhatsApp order status error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const sendCustomWhatsApp = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({ error: 'Missing required fields: phone, message' });
        }

        const result = await WhatsAppService.sendMessage(phone, message);

        res.json({ 
            success: result.success, 
            messageId: result.messageId,
            error: result.error 
        });

    } catch (error: any) {
        logger.error('WhatsApp custom message error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const sendPaymentReminderWhatsApp = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { phone, orderId, customerName, total } = req.body;

        if (!phone || !orderId) {
            return res.status(400).json({ error: 'Missing required fields: phone, orderId' });
        }

        const orderData = {
            customerPhone: phone,
            customerName: customerName || 'Customer',
            orderId,
            total: parseFloat(total) || 0
        };

        const result = await WhatsAppService.sendPaymentReminder(orderData);

        res.json({ 
            success: result.status === 'sent', 
            message: result.status === 'sent' ? 'Payment reminder sent' : 'Failed to send reminder',
            error: result.error
        });

    } catch (error: any) {
        logger.error('WhatsApp payment reminder error:', error);
        res.status(500).json({ error: error.message });
    }
};
