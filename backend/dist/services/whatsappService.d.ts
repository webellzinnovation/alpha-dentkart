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
declare class WhatsAppService {
    private businessNumber;
    private baseUrl;
    constructor();
    private generateWhatsAppLink;
    private sendWhatsAppMessage;
    sendOrderConfirmation(orderData: any): Promise<WhatsAppMessage>;
    sendShippingUpdate(orderData: any): Promise<WhatsAppMessage>;
    sendDeliveryConfirmation(orderData: any): Promise<WhatsAppMessage>;
    sendOrderCancellation(orderData: any): Promise<WhatsAppMessage>;
    sendPaymentReminder(orderData: any): Promise<WhatsAppMessage>;
    sendPromotionalOffer(customerData: any, couponData: any): Promise<WhatsAppMessage>;
    getNotificationStatus(notificationId: string): Promise<WhatsAppMessage | null>;
    getFailedNotifications(): Promise<WhatsAppMessage[]>;
    getMessageHistory(limit?: number): Promise<WhatsAppMessage[]>;
    sendSupportMessage(customerData: any): Promise<WhatsAppMessage>;
    private formatTemplate;
}
declare const _default: WhatsAppService;
export default _default;
//# sourceMappingURL=whatsappService.d.ts.map