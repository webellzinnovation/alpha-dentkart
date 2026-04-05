import React, { useState } from 'react';
import api from '../utils/api';

interface CancelOrderModalProps {
  orderId: string;
  orderStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ orderId, orderStatus, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason?: string } | null>(null);
  const [checking, setChecking] = useState(true);

  const reasons = [
    'Ordered by mistake',
    'Found better price elsewhere',
    'Delivery taking too long',
    'Changed my mind',
    'Product no longer needed',
    'Wrong item ordered',
    'Other'
  ];

  React.useEffect(() => {
    const checkEligibility = async () => {
      try {
        const response = await api.get(`/order-cancellation/check/${orderId}`);
        setEligibility(response.data);
      } catch {
        if (['Processing', 'Pending'].includes(orderStatus)) {
          setEligibility({ eligible: true });
        } else {
          setEligibility({ eligible: false, reason: 'Orders can only be cancelled before shipment.' });
        }
      } finally {
        setChecking(false);
      }
    };
    checkEligibility();
  }, [orderId, orderStatus]);

  const handleCancel = async () => {
    if (!selectedReason) {
      setError('Please select a reason for cancellation.');
      return;
    }
    if (selectedReason === 'Other' && !otherReason.trim()) {
      setError('Please provide a reason for cancellation.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/order-cancellation/cancel/${orderId}`, {
        reason: selectedReason === 'Other' ? otherReason : selectedReason
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking cancellation eligibility...</p>
        </div>
      </div>
    );
  }

  if (!eligibility?.eligible) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <i className="fas fa-ban text-4xl text-red-400 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Cannot Cancel Order</h3>
            <p className="text-gray-500 text-sm mb-6">{eligibility?.reason || 'This order cannot be cancelled at this time.'}</p>
            <button onClick={onClose} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Cancel Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-4">Order #{orderId.slice(0, 8).toUpperCase()}</p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for cancellation</label>
          <div className="space-y-2">
            {reasons.map(reason => (
              <label key={reason} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="radio"
                  name="cancelReason"
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="text-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {selectedReason === 'Other' && (
          <div className="mb-6">
            <textarea
              value={otherReason}
              onChange={e => setOtherReason(e.target.value)}
              placeholder="Please describe your reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800"
              rows={3}
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
            Keep Order
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Cancel Order'}
          </button>
        </div>
      </div>
    </div>
  );
};
