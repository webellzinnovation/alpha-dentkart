// WhatsApp Notification Service for Alpha Dentkart
// Using Meta WhatsApp Business Cloud API
import { db } from '../config/firebase';
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

interface WhatsAppConfig {
    accessToken: string;
    phoneNumberId: string;
    businessAccountId?: string;
}

const getWhatsAppConfig = async (): Promise<WhatsAppConfig | null> => {
    try {
        const settingsDoc = await db.doc('settings/store').get();
        if (!settingsDoc.exists) return null;
        
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
    } catch (error) {
        logger.error('Error getting WhatsApp config:', error);
        return null;
    }
};

const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/[^0-9]/g, '');
    const countryCode = '91'; // India default
    
    // Add country code if not present
    if (digits.length === 10) {
        return countryCode + digits;
    } else if (digits.startsWith(countryCode)) {
        return digits;
    }
    return digits;
};

class WhatsAppService {
    // Send WhatsApp message via Meta API
    async sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const config = await getWhatsAppConfig();
            
            if (!config) {
                logger.warn('WhatsApp not configured in settings');
                return { success: false, error: 'WhatsApp not configured' };
            }

            const formattedPhone = formatPhoneNumber(to);

            const response = await fetch(
                `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`,
                {
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
                }
            );

            const result = await response.json();

            if (!response.ok) {
                logger.error('WhatsApp API error:', result);
                return { success: false, error: result.error?.message || 'Failed to send WhatsApp message' };
            }

            logger.info(`WhatsApp message sent to ${to}`);
            return { success: true, messageId: result.messages?.[0]?.id };

        } catch (error: any) {
            logger.error('Error sending WhatsApp message:', error);
            return { success: false, error: error.message };
        }
    }

    // Send order confirmation
    async sendOrderConfirmation(orderData: any): Promise<WhatsAppMessage> {
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
    async sendShippingUpdate(orderData: any): Promise<WhatsAppMessage> {
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
    async sendDeliveryConfirmation(orderData: any): Promise<WhatsAppMessage> {
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
    async sendOrderCancellation(orderData: any): Promise<WhatsAppMessage> {
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
    async sendPaymentReminder(orderData: any): Promise<WhatsAppMessage> {
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
    async sendSupportMessage(customerData: any): Promise<WhatsAppMessage> {
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
}

export default new WhatsAppService();