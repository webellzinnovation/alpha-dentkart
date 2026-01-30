// WhatsApp Notification Service for Alpha Dentkart
// Shared number approach using wa.me links

export interface WhatsAppMessage {
    id: string;
    phoneNumber: string;
    messageType: 'order_confirmation' | 'shipping_update' | 'delivery_confirmation' | 'order_cancelled' | 'payment_reminder' | 'support_message' | 'promotion' | 'refund_notification';
    content: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    createdAt: Date;
    updatedAt: Date;
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
    private async sendWhatsAppMessage(message: WhatsAppMessage): Promise<WhatsAppMessage> {
        try {
            const notification = {
                id: message.id,
                phoneNumber: message.phoneNumber,
                messageType: message.messageType,
                content: message.content,
                status: 'sent',
                scheduledAt: message.scheduledAt,
                sentAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                retryCount: message.retryCount || 0
            };

            // Mock successful delivery
            console.log(`WhatsApp Message Generated: ${message.messageType}`);
            console.log(`Phone Number: ${message.phoneNumber}`);
            console.log(`WhatsApp Link: ${this.generateWhatsAppLink(message.phoneNumber, message.content)}`);
            console.log(`Content: ${message.content}`);

            return notification;
        } catch (error) {
            console.error('WhatsApp send error:', error);
            
            return {
                id: message.id,
                phoneNumber: message.phoneNumber,
                messageType: message.messageType,
                content: message.content,
                status: 'failed',
                retryCount: message.retryCount ? message.retryCount + 1 : 1,
                createdAt: message.createdAt,
                updatedAt: new Date(),
                error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
            };
        }
    }

    // Send order confirmation
    async sendOrderConfirmation(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'order_confirmation',
            content: `Hello ${orderData.customerName}! Your order #${orderData.orderId} has been confirmed and is being processed.\n\nEstimated delivery: ${orderData.estimatedDelivery}\n\nWe'll notify you via WhatsApp when your order ships.\n\nThank you for choosing Alpha Dentkart!`,
            templateName: 'Order Confirmed',
            variables: {
                customerName: orderData.customerName,
                orderId: orderData.orderId,
                orderTotal: orderData.total,
                deliveryDate: orderData.estimatedDelivery
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send shipping update
    async sendShippingUpdate(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'shipping_update',
            content: `Good news ${orderData.customerName}! Your order #${orderData.orderId} has been shipped via ${orderData.courierName}.\n\nTracking: ${orderData.trackingLink}\n\nExpected delivery by ${orderData.deliveryDate}.`,
            templateName: 'Order Shipped',
            variables: {
                customerName: orderData.customerName,
                orderId: orderData.orderId,
                courierName: orderData.courierName,
                trackingLink: orderData.trackingLink,
                deliveryDate: orderData.deliveryDate
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send delivery confirmation
    async sendDeliveryConfirmation(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'delivery_confirmation',
            content: `🎉 Congratulations ${orderData.customerName}! Your order #${orderData.orderId} has been successfully delivered!\n\nWe hope you love your dental supplies!\n\nRate your experience: https://alphadentkart.com/reviews/order/${orderData.orderId}`,
            templateName: 'Order Delivered',
            variables: {
                customerName: orderData.customerName,
                orderId: orderData.orderId,
                reviewLink: `https://alphadentkart.com/reviews/order/${orderData.orderId}`
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send order cancellation
    async sendOrderCancellation(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'order_cancelled',
            content: `Your order #${orderData.orderId} has been cancelled as requested.\n\nReason: ${orderData.reason}\n\nWe apologize for any inconvenience.`,
            templateName: 'Order Cancelled',
            variables: {
                customerName: orderData.customerName,
                orderId: orderData.orderId,
                reason: orderData.reason,
                refundStatus: orderData.refundStatus
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send payment reminder
    async sendPaymentReminder(orderData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: orderData.customerPhone,
            messageType: 'payment_reminder',
            content: `Hi ${orderData.customerName}! Your payment for order #${orderData.orderId} is due tomorrow.\n\nAmount: ₹${orderData.amount}\n\nPayment method: ${orderData.paymentMethod}.\n\nPlease ensure sufficient balance.`,
            templateName: 'Payment Reminder',
            variables: {
                customerName: orderData.customerName,
                orderId: orderData.orderId,
                amount: orderData.amount,
                dueDate: orderData.dueDate,
                paymentMethod: orderData.paymentMethod
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Send promotional message
    async sendPromotionalOffer(customerData: any, couponData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: customerData.customerPhone,
            messageType: 'promotion',
            content: `🎉 Special offer just for you! Use code ${couponData.couponCode} at checkout for ${couponData.discount}% off.\n\nValid until ${couponData.expiryDate}.\n\nLimited time remaining!`,
            templateName: 'Special Offer',
            variables: {
                customerName: customerData.customerName,
                couponCode: couponData.couponCode,
                discount: couponData.discount,
                expiryDate: couponData.expiryDate
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Get notification status
    async getNotificationStatus(notificationId: string): Promise<WhatsAppMessage | null> {
        // In production, query from database
        const mockStatus = {
            id: notificationId,
            status: 'sent',
            content: 'Notification sent',
            createdAt: new Date(Date.now() - 5 * 60 * 1000)
        };

        return mockStatus;
    }

    // Retry failed notifications
    async getFailedNotifications(): Promise<WhatsAppMessage[]> {
        // In production, query from database
        return [];
    }

    // Get message history
    async getMessageHistory(limit: number = 50): Promise<WhatsAppMessage[]> {
        // In production, query from database
        return [];
    }

    // Customer support message
    async sendSupportMessage(customerData: any): Promise<WhatsAppMessage> {
        const message = {
            id: `WHATSAPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            phoneNumber: customerData.customerPhone,
            messageType: 'support_message',
            content: `Thank you for contacting Alpha Dentkart support.\n\nHow can we help you today, ${customerData.customerName}?\n\nOur team will get back to you within 24 hours.`,
            templateName: 'Support Message',
            variables: {
                customerName: customerData.customerName
            }
        };

        return await this.sendWhatsAppMessage(message);
    }

    // Format template with variables
    private formatTemplate(templateName: string, variables?: Record<string, string>): string {
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