// WhatsApp Frontend Service - Client-side API wrapper
export interface WhatsAppMessage {
  messageId: string;
  phoneNumber: string;
  message: string;
  messageType: WhatsAppMessageType;
  templateType?: WhatsAppTemplateType;
  status: WhatsAppMessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  orderId?: string;
  variables?: Record<string, string>;
  retryCount?: number;
  lastRetryAt?: Date;
  error?: string;
  templateLanguage?: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppTemplate {
  name: string;
  content: string;
  type: WhatsAppTemplateType;
  category: string;
  variables: string[];
  supportedLanguages: string[];
  defaultLanguage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum WhatsAppMessageType {
  TRANSACTIONAL = 'transactional',
  PROMOTIONAL = 'promotional',
  OTP = 'otp',
  ALERT = 'alert'
}

export enum WhatsAppMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export enum WhatsAppTemplateType {
  ORDER_CONFIRMATION = 'order_confirmation',
  SHIPPING_UPDATE = 'shipping_update',
  DELIVERY_CONFIRMATION = 'delivery_confirmation',
  ORDER_CANCELLATION = 'order_cancellation',
  PAYMENT_REMINDER = 'payment_reminder',
  PROMOTIONAL_OFFER = 'promotional_offer',
  SUPPORT_MESSAGE = 'support_message',
  ACCOUNT_VERIFICATION = 'account_verification',
  WELCOME_MESSAGE = 'welcome_message',
  REFUND_PROCESSING = 'refund_processing'
}

export class WhatsAppService {
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.alphadentkart.com/api' 
    : 'http://localhost:8000/api';

  private static readonly ENDPOINTS = {
    SEND_MESSAGE: '/whatsapp/send-message',
    ORDER_CONFIRMATION: '/whatsapp/order-confirmation',
    SHIPPING_UPDATE: '/whatsapp/shipping-update',
    DELIVERY_CONFIRMATION: '/whatsapp/delivery-confirmation',
    ORDER_CANCELLATION: '/whatsapp/order-cancellation',
    PAYMENT_REMINDER: '/whatsapp/payment-reminder',
    PROMOTIONAL_OFFER: '/whatsapp/promotional-offer',
    SUPPORT_MESSAGE: '/whatsapp/support-message',
    MESSAGE_STATUS: '/whatsapp/message-status',
    MESSAGE_HISTORY: '/whatsapp/message-history',
    FAILED_NOTIFICATIONS: '/whatsapp/failed-notifications',
    RETRY_MESSAGE: '/whatsapp/retry-message',
    GET_TEMPLATES: '/whatsapp/templates',
    VALIDATE_PHONE: '/whatsapp/validate-phone'
  } as const;

  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`WhatsApp API Error (${endpoint}):`, error);
      throw error;
    }
  }

  static async sendOrderConfirmation(
    orderId: string,
    customerName: string,
    phoneNumber: string,
    estimatedDelivery?: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.ORDER_CONFIRMATION, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          customerName,
          phoneNumber,
          estimatedDelivery: estimatedDelivery?.toISOString()
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send order confirmation'
      };
    }
  }

  static async sendShippingUpdate(
    orderId: string,
    customerName: string,
    phoneNumber: string,
    trackingUrl?: string,
    estimatedDelivery?: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.SHIPPING_UPDATE, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          customerName,
          phoneNumber,
          trackingUrl,
          estimatedDelivery: estimatedDelivery?.toISOString()
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send shipping update'
      };
    }
  }

  static async sendDeliveryConfirmation(
    orderId: string,
    customerName: string,
    phoneNumber: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.DELIVERY_CONFIRMATION, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          customerName,
          phoneNumber
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send delivery confirmation'
      };
    }
  }

  static async sendOrderCancellation(
    orderId: string,
    customerName: string,
    phoneNumber: string,
    reason: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.ORDER_CANCELLATION, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          customerName,
          phoneNumber,
          reason
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send order cancellation'
      };
    }
  }

  static async sendPaymentReminder(
    orderId: string,
    customerName: string,
    phoneNumber: string,
    amount: number,
    dueDate: Date
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.PAYMENT_REMINDER, {
        method: 'POST',
        body: JSON.stringify({
          orderId,
          customerName,
          phoneNumber,
          amount,
          dueDate: dueDate.toISOString()
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send payment reminder'
      };
    }
  }

  static async sendPromotionalOffer(
    phoneNumber: string,
    customerName: string,
    message: string,
    couponCode?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.PROMOTIONAL_OFFER, {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          customerName,
          message,
          couponCode
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send promotional offer'
      };
    }
  }

  static async sendSupportMessage(
    phoneNumber: string,
    customerName: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messageId?: string;
        message?: string;
      }>(this.ENDPOINTS.SUPPORT_MESSAGE, {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          customerName,
          message
        }),
      });

      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send support message'
      };
    }
  }

  static async getMessageStatus(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        status: string;
        message?: string;
      }>(`${this.ENDPOINTS.MESSAGE_STATUS}/${messageId}`);

      return {
        status: result.status,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to get message status'
      };
    }
  }

  static async getMessageHistory(filters?: {
    phoneNumber?: string;
    orderId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: WhatsAppMessage[]; total: number; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.phoneNumber) queryParams.append('phoneNumber', filters.phoneNumber);
      if (filters?.orderId) queryParams.append('orderId', filters.orderId);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const endpoint = queryParams.toString() 
        ? `${this.ENDPOINTS.MESSAGE_HISTORY}?${queryParams.toString()}`
        : this.ENDPOINTS.MESSAGE_HISTORY;

      const result = await this.makeRequest<{
        success: boolean;
        messages: WhatsAppMessage[];
        total: number;
        message?: string;
      }>(endpoint);

      return {
        messages: result.messages || [],
        total: result.total || 0,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        messages: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to get message history'
      };
    }
  }

  static async getFailedNotifications(limit: number = 10): Promise<{ 
    messages: WhatsAppMessage[]; 
    error?: string 
  }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        messages: WhatsAppMessage[];
        message?: string;
      }>(`${this.ENDPOINTS.FAILED_NOTIFICATIONS}?limit=${limit}`);

      return {
        messages: result.messages || [],
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        messages: [],
        error: error instanceof Error ? error.message : 'Failed to get failed notifications'
      };
    }
  }

  static async retryMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        message?: string;
      }>(this.ENDPOINTS.RETRY_MESSAGE, {
        method: 'POST',
        body: JSON.stringify({ messageId }),
      });

      return {
        success: result.success,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retry message'
      };
    }
  }

  static async getTemplates(): Promise<{ templates: WhatsAppTemplate[]; error?: string }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        templates: WhatsAppTemplate[];
        message?: string;
      }>(this.ENDPOINTS.GET_TEMPLATES);

      return {
        templates: result.templates || [],
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        templates: [],
        error: error instanceof Error ? error.message : 'Failed to get templates'
      };
    }
  }

  static async validatePhoneNumber(phoneNumber: string): Promise<{ 
    isValid: boolean; 
    formatted?: string; 
    error?: string 
  }> {
    try {
      const result = await this.makeRequest<{
        success: boolean;
        isValid: boolean;
        formatted?: string;
        message?: string;
      }>(`${this.ENDPOINTS.VALIDATE_PHONE}/${encodeURIComponent(phoneNumber)}`);

      return {
        isValid: result.isValid,
        formatted: result.formatted,
        error: result.success ? undefined : result.message
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to validate phone number'
      };
    }
  }
}

export default WhatsAppService;