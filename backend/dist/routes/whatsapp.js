"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsappService_1 = __importDefault(require("../services/whatsappService"));
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
// Send WhatsApp order confirmation
router.post('/send-order-confirmation', async (req, res) => {
    try {
        const { phone, orderData } = req.body;
        if (!phone || !orderData) {
            return res.status(400).json({ error: 'Phone and orderData required' });
        }
        const result = await whatsappService_1.default.sendOrderConfirmation(orderData);
        logger_1.default.info('WhatsApp order confirmation sent', { phone, orderId: orderData.id });
        res.json({ success: true, message: 'WhatsApp message generated', waLink: result });
    }
    catch (error) {
        logger_1.default.error('WhatsApp order confirmation error', { error });
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});
// Send WhatsApp shipping update
router.post('/send-shipping-update', async (req, res) => {
    try {
        const { phone, orderData } = req.body;
        if (!phone || !orderData) {
            return res.status(400).json({ error: 'Phone and orderData required' });
        }
        const result = await whatsappService_1.default.sendShippingUpdate(orderData);
        res.json({ success: true, waLink: result });
    }
    catch (error) {
        logger_1.default.error('WhatsApp shipping update error', { error });
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
});
// Get message history
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const history = whatsappService_1.default.getMessageHistory(limit);
        res.json({ history });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get message history' });
    }
});
exports.default = router;
//# sourceMappingURL=whatsapp.js.map