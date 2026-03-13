"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// WhatsApp Notification Service for Alpha Dentkart
// Using Meta WhatsApp Business Cloud API
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const getWhatsAppConfig = async () => {
    try {
        const settingsDoc = await firebase_1.db.doc('settings/store').get();
        if (!settingsDoc.exists)
            return null;
        const settings = settingsDoc.data();
        const whatsappSettings = settings?.whatsapp;
        if (!whatsappSettings?.accessToken || !whatsappSettings?.phoneNumberId) {
            return null;
        }
        return {
            accessToken: whatsappSettings.accessToken,
            phoneNumberId: whatsappSettings.phoneNumberId,
            businessAccountId: whatsappSettings.businessAccountId
        };
    }
    catch (error) {
        logger_1.default.error('Error getting WhatsApp config:', error);
        return null;
    }
};
const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const digits = phone.replace(/[^0-9]/g, '');
    const countryCode = '91'; // India default
    // Add country code if not present
    if (digits.length === 10) {
        return countryCode + digits;
    }
    else if (digits.startsWith(countryCode)) {
        return digits;
    }
    return digits;
};
class WhatsAppService {
    // Send WhatsApp message via Meta API
    async sendMessage(to, message) {
        try {
            const config = await getWhatsAppConfig();
            if (!config) {
                logger_1.default.warn('WhatsApp not configured in settings');
                return { success: false, error: 'WhatsApp not configured' };
            }
            const formattedPhone = formatPhoneNumber(to);
            const response = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'text',
                    text: { body: message }
                })
            });
            const result = await response.json();
            if (!response.ok) {
                logger_1.default.error('WhatsApp API error:', result);
                return { success: false, error: result.error?.message || 'Failed to send WhatsApp message' };
            }
            logger_1.default.info(`WhatsApp message sent to ${to}`);
            return { success: true, messageId: result.messages?.[0]?.id };
        }
        catch (error) {
            logger_1.default.error('Error sending WhatsApp message:', error);
            return { success: false, error: error.message };
        }
    }
    // Send order confirmation
    async sendOrderConfirmation(orderData) {
        const message = `Hello ${orderData.customerName}! 🎉\n\nYour order #${orderData.orderId} has been confirmed!\n\nTotal: ₹${(orderData.total || 0).toLocaleString('en-IN')}\n\nWe'll notify you once it's shipped! - Alpha Dentkart`;
        const result = await this.sendMessage(orderData.customerPhone, message);
        return {
            id: result.messageId || `WHATSAPP_${Date.now()}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'order_confirmation',
            content: message,
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            error: result.error
        };
    }
    // Send shipping update
    async sendShippingUpdate(orderData) {
        const message = `Good news ${orderData.customerName}! 🚚\n\nYour order #${orderData.orderId} has been shipped!\n\nCourier: ${orderData.trackingProvider}\nTracking: ${orderData.trackingNumber}\n\nTrack: ${orderData.trackingUrl || 'Check your email for updates'} - Alpha Dentkart`;
        const result = await this.sendMessage(orderData.customerPhone, message);
        return {
            id: result.messageId || `WHATSAPP_${Date.now()}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'shipping_update',
            content: message,
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            error: result.error
        };
    }
    // Send delivery confirmation
    async sendDeliveryConfirmation(orderData) {
        const message = `🎉 Your order #${orderData.orderId} has been delivered!\n\nThank you for shopping with Alpha Dentkart! We'd love to hear your feedback. - Alpha Dentkart`;
        const result = await this.sendMessage(orderData.customerPhone, message);
        return {
            id: result.messageId || `WHATSAPP_${Date.now()}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'delivery_confirmation',
            content: message,
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            error: result.error
        };
    }
    // Send order cancellation
    async sendOrderCancellation(orderData) {
        const message = `Your order #${orderData.orderId} has been cancelled. ❌\n\nReason: ${orderData.reason || 'No reason specified'}\n\nIf you have questions, contact us. - Alpha Dentkart`;
        const result = await this.sendMessage(orderData.customerPhone, message);
        return {
            id: result.messageId || `WHATSAPP_${Date.now()}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'order_cancelled',
            content: message,
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            error: result.error
        };
    }
    // Send payment reminder
    async sendPaymentReminder(orderData) {
        const message = `Hi ${orderData.customerName}! ⏰\n\nYour payment for order #${orderData.orderId} is pending.\n\nTotal: ₹${(orderData.total || 0).toLocaleString('en-IN')}\n\nComplete payment to confirm your order! - Alpha Dentkart`;
        const result = await this.sendMessage(orderData.customerPhone, message);
        return {
            id: result.messageId || `WHATSAPP_${Date.now()}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'payment_reminder',
            content: message,
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            error: result.error
        };
    }
    // Customer support message
    async sendSupportMessage(customerData) {
        const message = `Thank you for contacting Alpha Dentkart support, ${customerData.customerName}! 💬\n\nWe'll get back to you shortly. - Alpha Dentkart`;
        const result = await this.sendMessage(customerData.customerPhone, message);
        return {
            id: result.messageId || `WHATSAPP_${Date.now()}`,
            phoneNumber: customerData.customerPhone,
            messageType: 'support_message',
            content: message,
            status: result.success ? 'sent' : 'failed',
            sentAt: result.success ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            error: result.error
        };
    }
    // Get notification status
    async getNotificationStatus(notificationId) {
        return {
            id: notificationId,
            phoneNumber: '919876543210',
            messageType: 'order_confirmation',
            status: 'sent',
            content: 'Notification sent',
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
            updatedAt: new Date()
        };
    }
    // Retry failed notifications
    async getFailedNotifications() {
        return [];
    }
    // Get message history
    async getMessageHistory(limit = 50) {
        return [];
    }
}
exports.default = new WhatsAppService();
//# sourceMappingURL=whatsappService.js.map