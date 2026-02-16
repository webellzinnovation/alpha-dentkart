import React, { useState, useEffect } from 'react';
import { useWhatsAppNotifications } from '../hooks/useWhatsAppNotifications';
import { WhatsAppService, WhatsAppMessage } from '../services/whatsappService';

interface WhatsAppNotificationManagerProps {
  orderId?: string;
  customerName?: string;
  phoneNumber?: string;
  onNotificationSent?: (messageId: string) => void;
}

export const WhatsAppNotificationManager: React.FC<WhatsAppNotificationManagerProps> = ({
  orderId,
  customerName,
  phoneNumber,
  onNotificationSent
}) => {
  const {
    isLoading,
    error,
    sendOrderConfirmation,
    sendShippingUpdate,
    sendDeliveryConfirmation,
    sendOrderCancellation,
    sendPaymentReminder,
    sendPromotionalOffer,
    sendSupportMessage,
    clearError
  } = useWhatsAppNotifications();

  const [messageHistory, setMessageHistory] = useState<WhatsAppMessage[]>([]);
  const [activeTab, setActiveTab] = useState('send');

  // Form states
  const [customMessage, setCustomMessage] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    loadMessageHistory();
  }, []);

  const loadMessageHistory = async () => {
    try {
      const result = await WhatsAppService.getMessageHistory({
        orderId,
        phoneNumber,
        limit: 20
      });
      if (!result.error) {
        setMessageHistory(result.messages);
      }
    } catch (err) {
      console.error('Failed to load message history:', err);
    }
  };

  const handleSendOrderConfirmation = async () => {
    if (!orderId || !customerName || !phoneNumber) return;
    
    try {
      const result = await sendOrderConfirmation(
        orderId,
        customerName,
        phoneNumber,
        estimatedDelivery ? new Date(estimatedDelivery) : undefined
      );
      
      if (result.success && result.messageId) {
        onNotificationSent?.(result.messageId);
        loadMessageHistory();
        clearForm();
      }
    } catch (err) {
      console.error('Failed to send order confirmation:', err);
    }
  };

  const handleSendShippingUpdate = async () => {
    if (!orderId || !customerName || !phoneNumber) return;
    
    try {
      const result = await sendShippingUpdate(
        orderId,
        customerName,
        phoneNumber,
        trackingUrl || undefined,
        estimatedDelivery ? new Date(estimatedDelivery) : undefined
      );
      
      if (result.success && result.messageId) {
        onNotificationSent?.(result.messageId);
        loadMessageHistory();
        clearForm();
      }
    } catch (err) {
      console.error('Failed to send shipping update:', err);
    }
  };

  const handleSendDeliveryConfirmation = async () => {
    if (!orderId || !customerName || !phoneNumber) return;
    
    try {
      const result = await sendDeliveryConfirmation(orderId, customerName, phoneNumber);
      
      if (result.success && result.messageId) {
        onNotificationSent?.(result.messageId);
        loadMessageHistory();
        clearForm();
      }
    } catch (err) {
      console.error('Failed to send delivery confirmation:', err);
    }
  };

  const handleSendOrderCancellation = async () => {
    if (!orderId || !customerName || !phoneNumber || !cancelReason) return;
    
    try {
      const result = await sendOrderCancellation(orderId, customerName, phoneNumber, cancelReason);
      
      if (result.success && result.messageId) {
        onNotificationSent?.(result.messageId);
        loadMessageHistory();
        clearForm();
      }
    } catch (err) {
      console.error('Failed to send order cancellation:', err);
    }
  };

  const handleSendPaymentReminder = async () => {
    if (!orderId || !customerName || !phoneNumber || !paymentAmount) return;
    
    try {
      const result = await sendPaymentReminder(
        orderId,
        customerName,
        phoneNumber,
        parseFloat(paymentAmount),
        new Date()
      );
      
      if (result.success && result.messageId) {
        onNotificationSent?.(result.messageId);
        loadMessageHistory();
        clearForm();
      }
    } catch (err) {
      console.error('Failed to send payment reminder:', err);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!customerName || !phoneNumber || !customMessage) return;
    
    try {
      const result = await sendSupportMessage(phoneNumber, customerName, customMessage);
      
      if (result.success && result.messageId) {
        onNotificationSent?.(result.messageId);
        loadMessageHistory();
        clearForm();
      }
    } catch (err) {
      console.error('Failed to send custom message:', err);
    }
  };

  const clearForm = () => {
    setCustomMessage('');
    setTrackingUrl('');
    setEstimatedDelivery('');
    setCancelReason('');
    setPaymentAmount('');
    setCouponCode('');
    clearError();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-purple-100 text-purple-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">WhatsApp Notifications</h2>
          <p className="text-gray-600 mt-1">Send WhatsApp messages to customers about their orders</p>
        </div>
        <div className="p-6">
          <div className="flex space-x-4 border-b mb-6">
            <button
              onClick={() => setActiveTab('send')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Send Message
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              History
            </button>
          </div>

          {activeTab === 'send' && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={customerName || ''}
                    placeholder="Enter customer name"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={phoneNumber || ''}
                    placeholder="Enter WhatsApp number"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Order Confirmation</h4>
                  <div className="space-y-2">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                    />
                    <button
                      onClick={handleSendOrderConfirmation}
                      disabled={isLoading || !orderId || !customerName || !phoneNumber}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sending...' : 'Send Confirmation'}
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Shipping Update</h4>
                  <div className="space-y-2">
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tracking URL"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                    />
                    <button
                      onClick={handleSendShippingUpdate}
                      disabled={isLoading || !orderId || !customerName || !phoneNumber}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sending...' : 'Send Update'}
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Delivery Confirmation</h4>
                  <button
                    onClick={handleSendDeliveryConfirmation}
                    disabled={isLoading || !orderId || !customerName || !phoneNumber}
                    className="w-full bg-green-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Confirm Delivery'}
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Order Cancellation</h4>
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cancellation reason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={handleSendOrderCancellation}
                      disabled={isLoading || !orderId || !customerName || !phoneNumber || !cancelReason}
                      className="w-full bg-red-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sending...' : 'Cancel Order'}
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Payment Reminder</h4>
                  <div className="space-y-2">
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    <button
                      onClick={handleSendPaymentReminder}
                      disabled={isLoading || !orderId || !customerName || !phoneNumber || !paymentAmount}
                      className="w-full bg-yellow-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sending...' : 'Send Reminder'}
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-3">Custom Message</h4>
                  <div className="space-y-2">
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your message"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={2}
                    />
                    <button
                      onClick={handleSendCustomMessage}
                      disabled={isLoading || !customerName || !phoneNumber || !customMessage}
                      className="w-full bg-gray-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {messageHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No message history found</p>
              ) : (
                messageHistory.map((message) => (
                  <div key={message.messageId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{message.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.sentAt.toLocaleDateString()} {message.sentAt.toLocaleTimeString()}
                        </p>
                        {message.orderId && (
                          <p className="text-xs text-gray-500">Order: {message.orderId}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {message.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppNotificationManager;