"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentReminderWhatsApp = exports.sendCustomWhatsApp = exports.sendOrderStatusWhatsApp = void 0;
const whatsappService_1 = __importDefault(require("../services/whatsappService"));
const logger_1 = __importDefault(require("../utils/logger"));
const sendOrderStatusWhatsApp = async (req, res) => {
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
                result = await whatsappService_1.default.sendOrderConfirmation(orderData);
                break;
            case 'Shipped':
                result = await whatsappService_1.default.sendShippingUpdate(orderData);
                break;
            case 'Delivered':
                result = await whatsappService_1.default.sendDeliveryConfirmation(orderData);
                break;
            case 'Cancelled':
                result = await whatsappService_1.default.sendOrderCancellation(orderData);
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
    }
    catch (error) {
        logger_1.default.error('WhatsApp order status error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.sendOrderStatusWhatsApp = sendOrderStatusWhatsApp;
const sendCustomWhatsApp = async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ error: 'Missing required fields: phone, message' });
        }
        const result = await whatsappService_1.default.sendMessage(phone, message);
        res.json({
            success: result.success,
            messageId: result.messageId,
            error: result.error
        });
    }
    catch (error) {
        logger_1.default.error('WhatsApp custom message error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.sendCustomWhatsApp = sendCustomWhatsApp;
const sendPaymentReminderWhatsApp = async (req, res) => {
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
        const result = await whatsappService_1.default.sendPaymentReminder(orderData);
        res.json({
            success: result.status === 'sent',
            message: result.status === 'sent' ? 'Payment reminder sent' : 'Failed to send reminder',
            error: result.error
        });
    }
    catch (error) {
        logger_1.default.error('WhatsApp payment reminder error:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.sendPaymentReminderWhatsApp = sendPaymentReminderWhatsApp;
//# sourceMappingURL=whatsappController.js.map