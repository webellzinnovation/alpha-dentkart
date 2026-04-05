import React, { useState } from 'react';
import api from '../utils/api';

interface DeliveryEstimatorProps {
  pincode?: string;
  onEstimate?: (data: any) => void;
}

export const DeliveryEstimator: React.FC<DeliveryEstimatorProps> = ({ pincode: initialPincode, onEstimate }) => {
  const [pincode, setPincode] = useState(initialPincode || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkPincode = async () => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/delivery-estimation/check-pincode', { pincode });
      setResult(response.data);
      onEstimate?.(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check pincode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
        <i className="fas fa-truck text-primary"></i> Delivery Estimation
      </h4>
      <div className="flex gap-2">
        <input
          type="text"
          value={pincode}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            setPincode(val);
            setError('');
          }}
          placeholder="Enter pincode"
          maxLength={6}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800"
        />
        <button
          onClick={checkPincode}
          disabled={loading || pincode.length !== 6}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Check'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {result && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          {result.serviceable ? (
            <div className="space-y-1">
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <i className="fas fa-check-circle"></i> Delivery available
              </p>
              {result.estimatedDays && (
                <p className="text-xs text-gray-500">
                  Estimated delivery: <span className="font-medium text-gray-700 dark:text-gray-300">{result.estimatedDays} business days</span>
                </p>
              )}
              {result.shippingCost !== undefined && (
                <p className="text-xs text-gray-500">
                  Shipping: <span className="font-medium text-gray-700 dark:text-gray-300">{result.shippingCost === 0 ? 'FREE' : `₹${result.shippingCost}`}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <i className="fas fa-times-circle"></i> Delivery not available to this pincode
            </p>
          )}
        </div>
      )}
    </div>
  );
};
