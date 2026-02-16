import { useState, useCallback } from 'react';
import { WhatsAppService, WhatsAppMessageType, WhatsAppTemplateType } from '../services/whatsappService';

export interface WhatsAppNotificationHook {
  isLoading: boolean;
  error: string | null;
  sendOrderConfirmation: (orderId: string, customerName: string, whatsappNumber: string, estimatedDelivery?: Date) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendShippingUpdate: (orderId: string, customerName: string, whatsappNumber: string, trackingUrl?: string, estimatedDelivery?: Date) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendDeliveryConfirmation: (orderId: string, customerName: string, whatsappNumber: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendOrderCancellation: (orderId: string, customerName: string, whatsappNumber: string, reason: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendPaymentReminder: (orderId: string, customerName: string, whatsappNumber: string, amount: number, dueDate: Date) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendPromotionalOffer: (phoneNumber: string, customerName: string, message: string, couponCode?: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendSupportMessage: (phoneNumber: string, customerName: string, message: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  getMessageStatus: (messageId: string) => Promise<{ status: string; error?: string }>;
  clearError: () => void;
}

export const useWhatsAppNotifications = (): WhatsAppNotificationHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendOrderConfirmation = useCallback(async (
    orderId: string,
    customerName: string,
    whatsappNumber: string,
    estimatedDelivery?: Date
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendOrderConfirmation(orderId, customerName, whatsappNumber, estimatedDelivery);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send order confirmation');
      }
      return result;
    });
  }, [handleApiCall]);

  const sendShippingUpdate = useCallback(async (
    orderId: string,
    customerName: string,
    whatsappNumber: string,
    trackingUrl?: string,
    estimatedDelivery?: Date
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendShippingUpdate(orderId, customerName, whatsappNumber, trackingUrl, estimatedDelivery);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send shipping update');
      }
      return result;
    });
  }, [handleApiCall]);

  const sendDeliveryConfirmation = useCallback(async (
    orderId: string,
    customerName: string,
    whatsappNumber: string
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendDeliveryConfirmation(orderId, customerName, whatsappNumber);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send delivery confirmation');
      }
      return result;
    });
  }, [handleApiCall]);

  const sendOrderCancellation = useCallback(async (
    orderId: string,
    customerName: string,
    whatsappNumber: string,
    reason: string
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendOrderCancellation(orderId, customerName, whatsappNumber, reason);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send order cancellation');
      }
      return result;
    });
  }, [handleApiCall]);

  const sendPaymentReminder = useCallback(async (
    orderId: string,
    customerName: string,
    whatsappNumber: string,
    amount: number,
    dueDate: Date
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendPaymentReminder(orderId, customerName, whatsappNumber, amount, dueDate);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send payment reminder');
      }
      return result;
    });
  }, [handleApiCall]);

  const sendPromotionalOffer = useCallback(async (
    phoneNumber: string,
    customerName: string,
    message: string,
    couponCode?: string
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendPromotionalOffer(phoneNumber, customerName, message, couponCode);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send promotional offer');
      }
      return result;
    });
  }, [handleApiCall]);

  const sendSupportMessage = useCallback(async (
    phoneNumber: string,
    customerName: string,
    message: string
  ) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.sendSupportMessage(phoneNumber, customerName, message);
      if (!result.success) {
        throw new Error(result.error || 'Failed to send support message');
      }
      return result;
    });
  }, [handleApiCall]);

  const getMessageStatus = useCallback(async (messageId: string) => {
    return handleApiCall(async () => {
      const result = await WhatsAppService.getMessageStatus(messageId);
      return result;
    });
  }, [handleApiCall]);

  return {
    isLoading,
    error,
    sendOrderConfirmation,
    sendShippingUpdate,
    sendDeliveryConfirmation,
    sendOrderCancellation,
    sendPaymentReminder,
    sendPromotionalOffer,
    sendSupportMessage,
    getMessageStatus,
    clearError
  };
};

export default useWhatsAppNotifications;