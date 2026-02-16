// WhatsApp Notification Service for Alpha Dentkart
// Shared number approach using wa.me links
import logger from '../utils/logger';

export interface WhatsAppMessage {
    id: string;
    phoneNumber: string;
    messageType: 'order_confirmation' | 'shipping_update' | 'delivery_confirmation' | 'order_cancelled' | 'payment_reminder' | 'support_message' | 'promotion' | 'refund_notification';
    content: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    scheduledAt?: Date;
    sentAt?: Date;
    retryCount?: number;
    error?: string;
    templateName?: string;
    variables?: Record<string, any>;
}

export interface NotificationPreferences {
    orderUpdates: boolean;
    marketingMessages: boolean;
    supportMessages: boolean;
    whatsappOptIn: boolean;
}

class WhatsAppService {
    private businessNumber: string;
    private baseUrl: string;

    constructor() {
        this.businessNumber = process.env.WHATSAPP_BUSINESS_NUMBER || '91987643210';
        this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    }

    // Generate WhatsApp link for shared number approach
    private generateWhatsAppLink(phoneNumber: string, message: string): string {
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }

    // Send WhatsApp notification (simulated)
    private async sendWhatsAppMessage(message: Partial<WhatsAppMessage> & { phoneNumber: string; messageType: any; content: string }): Promise<WhatsAppMessage> {
        try {
            const notification: WhatsAppMessage = {
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
            logger.info(`WhatsApp Message Generated: ${message.messageType}`);
            logger.info(`Phone Number: ${message.phoneNumber}`);
            logger.info(`WhatsApp Link: ${this.generateWhatsAppLink(message.phoneNumber, message.content)}`);

            return notification;
        } catch (error) {
            logger.error('WhatsApp send error:', error);

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
    async sendOrderConfirmation(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'order_confirmation' as const,
            content: `Hello ${orderData.customerName}! Your order #${orderData.orderId} has been confirmed.\n\nEstimated delivery: ${orderData.estimatedDelivery}`,
            templateName: 'Order Confirmed',
            variables: { orderId: orderData.orderId }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send shipping update
    async sendShippingUpdate(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'shipping_update' as const,
            content: `Good news ${orderData.customerName}! Your order #${orderData.orderId} has been shipped.\n\nTracking: ${orderData.trackingLink}`,
            templateName: 'Order Shipped'
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send delivery confirmation
    async sendDeliveryConfirmation(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'delivery_confirmation' as const,
            content: `🎉 Your order #${orderData.orderId} has been delivered!`,
            templateName: 'Order Delivered'
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send order cancellation
    async sendOrderCancellation(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'order_cancelled' as const,
            content: `Your order #${orderData.orderId} has been cancelled.\n\nReason: ${orderData.reason}`,
            templateName: 'Order Cancelled'
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send payment reminder
    async sendPaymentReminder(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: orderData.customerPhone,
            messageType: 'payment_reminder' as const,
            content: `Hi ${orderData.customerName}! Your payment for order #${orderData.orderId} is due tomorrow.`,
            templateName: 'Payment Reminder'
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send promotional message
    async sendPromotionalOffer(customerData: any, couponData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: customerData.customerPhone,
            messageType: 'promotion' as const,
            content: `🎉 Use code ${couponData.couponCode} for ${couponData.discount}% off!`,
            templateName: 'Special Offer'
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Get notification status
    async getNotificationStatus(notificationId: string): Promise<WhatsAppMessage | null> {
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
    async getFailedNotifications(): Promise<WhatsAppMessage[]> {
        return [];
    }

    // Get message history
    async getMessageHistory(limit: number = 50): Promise<WhatsAppMessage[]> {
        return [];
    }

    // Customer support message
    async sendSupportMessage(customerData: any): Promise<WhatsAppMessage> {
        const message = {
            phoneNumber: customerData.customerPhone,
            messageType: 'support_message' as const,
            content: `Thank you for contacting Alpha Dentkart support, ${customerData.customerName}.`,
            templateName: 'Support Message'
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Format template with variables
    private formatTemplate(template: { template: string }, variables?: Record<string, string>): string {
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

export default new WhatsAppService();