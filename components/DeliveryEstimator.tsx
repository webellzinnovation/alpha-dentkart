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
    setResult(null);
    try {
      const response = await api.post('/delivery-estimation/check-pincode', { pincode });
      if (response.data.success) {
        setResult(response.data);
        onEstimate?.(response.data);
      } else {
        setError(response.data.error || 'Pincode check failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check pincode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="fas fa-truck-fast text-xs"></i>
            </span>
            Delivery Estimation
          </h4>
          {pincode.length === 6 && !loading && !result && (
            <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold animate-pulse">
              Ready to check
            </span>
          )}
        </div>

        <div className="relative group">
          <input
            type="text"
            value={pincode}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(val);
              setError('');
              if (val.length < 6) setResult(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && checkPincode()}
            placeholder="Enter your pincode"
            maxLength={6}
            className="w-full pl-4 pr-24 py-3 bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm transition-all outline-none"
          />
          <button
            onClick={checkPincode}
            disabled={loading || pincode.length !== 6}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-gray-900 dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'CHECK'}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-top-1">
            <i className="fas fa-exclamation-triangle text-[10px]"></i>
            <p className="text-[11px] font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-5 space-y-4 animate-in zoom-in-95 duration-300">
            {result.serviceable ? (
              <>
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20">
                      <i className="fas fa-check text-xs"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-700 dark:text-green-400">Fast Delivery Available</p>
                      <p className="text-[10px] text-green-600/70 dark:text-green-500/60 font-medium">
                        {result.pincode.city}, {result.pincode.state}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter mb-1">Estimated Arrival</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      {result.pincode.deliveryDays} {result.pincode.deliveryDays === 1 ? 'Day' : 'Days'}
                    </p>
                    {result.pincode.estimatedArrivalDate && (
                      <p className="text-[9px] text-gray-400 mt-0.5 font-medium">
                        By {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(result.pincode.estimatedArrivalDate))}
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter mb-1">COD Status</p>
                    <p className={`text-sm font-black ${result.pincode.codAvailable ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                      {result.pincode.codAvailable ? 'Available' : 'Prepaid Only'}
                    </p>
                  </div>
                </div>

                {result.pincode.estimatedCost && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] text-gray-400 font-medium italic">Standard Shipping Estimate</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {result.pincode.estimatedCost.standard === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${result.pincode.estimatedCost.standard}`
                      )}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center">
                  <i className="fas fa-times text-xs"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-700 dark:text-red-400">Non-Serviceable Area</p>
                  <p className="text-[10px] text-red-600/70 dark:text-red-500/60">We are expanding soon. Stay tuned!</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
