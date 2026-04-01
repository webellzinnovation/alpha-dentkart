"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// WhatsApp Notification Service for Alpha Dentkart
// Shared number approach using wa.me links
const logger_1 = __importDefault(require("../utils/logger"));
class WhatsAppService {
    constructor() {
        this.businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '91987643210';
        this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    }
    // Generate WhatsApp link for shared number approach
    generateWhatsAppLink(phoneNumber, message) {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }
    // Send WhatsApp notification (simulated)
    async sendWhatsAppMessage(message) {
        try {
            const notification = {
                id: message.id || `WHATSAPP_${Date.now()}`,
                phoneNumber: message.phoneNumber,
                messageType: message.messageType,
                content: message.content,
                status: 'sent',
                scheduledAt: message.scheduledAt,
                sentAt: new Date(),
                createdAt: message.createdAt || new Date(),
                updatedAt: new Date(),
                retryCount: message.retryCount || 0,
                templateName: message.templateName,
                variables: message.variables
            };
            // Mock successful delivery
            logger_1.default.info(`WhatsApp Message Generated: ${message.messageType}`);
            logger_1.default.info(`Phone Number: ${message.phoneNumber}`);
            logger_1.default.info(`WhatsApp Link: ${this.generateWhatsAppLink(message.phoneNumber, message.content)}`);
            return notification;
        }
        catch (error) {
            logger_1.default.error('WhatsApp send error:', error);
            return {
                id: message.id || `WHATSAPP_${Date.now()}`,
                phoneNumber: message.phoneNumber,
                messageType: message.messageType,
                content: message.content,
                status: 'failed',
                retryCount: (message.retryCount || 0) + 1,
                createdAt: message.createdAt || new Date(),
                updatedAt: new Date(),
                error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
            };
        }
    }
    // Send order confirmation
    async sendOrderConfirmation(orderData) {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'order_confirmation',
            content: `Hello ${orderData.customerName}! Your order #${orderData.orderId} has been confirmed.\n\nEstimated delivery: ${orderData.estimatedDelivery}`,
            templateName: 'Order Confirmed',
            variables: { orderId: orderData.orderId }
        };
        return await this.sendWhatsAppMessage(message);
    }
    // Send shipping update
    async sendShippingUpdate(orderData) {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'shipping_update',
            content: `Good news ${orderData.customerName}! Your order #${orderData.orderId} has been shipped.\n\nTracking: ${orderData.trackingLink}`,
            templateName: 'Order Shipped'
        };
        return await this.sendWhatsAppMessage(message);
    }
    // Send delivery confirmation
    async sendDeliveryConfirmation(orderData) {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'delivery_confirmation',
            content: `🎉 Your order #${orderData.orderId} has been delivered!`,
            templateName: 'Order Delivered'
        };
        return await this.sendWhatsAppMessage(message);
    }
    // Send order cancellation
    async sendOrderCancellation(orderData) {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'order_cancelled',
            content: `Your order #${orderData.orderId} has been cancelled.\n\nReason: ${orderData.reason}`,
            templateName: 'Order Cancelled'
        };
        return await this.sendWhatsAppMessage(message);
    }
    // Send payment reminder
    async sendPaymentReminder(orderData) {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'payment_reminder',
            content: `Hi ${orderData.customerName}! Your payment for order #${orderData.orderId} is due tomorrow.`,
            templateName: 'Payment Reminder'
        };
        return await this.sendWhatsAppMessage(message);
    }
    // Send promotional message
    async sendPromotionalOffer(customerData, couponData) {
        const message = {
            phoneNumber: customerData.customerPhone,
            messageType: 'promotion',
            content: `🎉 Use code ${couponData.couponCode} for ${couponData.discount}% off!`,
            templateName: 'Special Offer'
        };
        return await this.sendWhatsAppMessage(message);
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
    // Customer support message
    async sendSupportMessage(customerData) {
        const message = {
            phoneNumber: customerData.customerPhone,
            messageType: 'support_message',
            content: `Thank you for contacting Alpha Dentkart support, ${customerData.customerName}.`,
            templateName: 'Support Message'
        };
        return await this.sendWhatsAppMessage(message);
    }
    // Format template with variables
    formatTemplate(template, variables) {
        let formatted = template.template;
        if (variables) {
            Object.entries(variables).forEach(([key, value]) => {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                formatted = formatted.replace(regex, value);
            });
        }
        return formatted;
    }
}
exports.default = new WhatsAppService();
//# sourceMappingURL=whatsappService.js.map