import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface OrderTrackingProps {
  orderId: string;
  onClose?: () => void;
}

interface TrackingCheckpoint {
  date: string;
  time: string;
  location: string;
  status: string;
}

interface TrackingData {
  orderId: string;
  awbNumber: string;
  courierName: string;
  currentStatus: string;
  estimatedDelivery: string;
  checkpoints: TrackingCheckpoint[];
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, onClose }) => {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await api.post('/shiprocket/track', { orderId });
        if (response.data && response.data.tracking) {
          setTrackingData(response.data.tracking);
        } else {
          setError('Tracking information not available yet. The order may not have been shipped.');
        }
      } catch (err: any) {
        console.error('Tracking fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchTracking();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <i className="fas fa-truck text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Tracking Unavailable</h3>
          <p className="text-gray-500 text-sm">{error}</p>
          {onClose && (
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <i className="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Tracking Info</h3>
          <p className="text-gray-500 text-sm">Tracking information will appear once your order is shipped.</p>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { label: 'Order Placed', key: 'order_placed' },
    { label: 'Picked Up', key: 'picked_up' },
    { label: 'In Transit', key: 'in_transit' },
    { label: 'Out for Delivery', key: 'out_for_delivery' },
    { label: 'Delivered', key: 'delivered' }
  ];

  const getCurrentStepIndex = (status: string) => {
    const s = status.toLowerCase().replace(/\s+/g, '_');
    const idx = statusSteps.findIndex(step => step.key === s);
    return idx >= 0 ? idx : 1;
  };

  const currentStep = getCurrentStepIndex(trackingData.currentStatus);

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-truck text-primary"></i> Order Tracking
          </h2>
          <p className="text-sm text-gray-500 mt-1">Order #{orderId.slice(0, 8).toUpperCase()}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {/* Shipment Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div>
          <p className="text-xs text-gray-500">AWB Number</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{trackingData.awbNumber || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Courier</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">{trackingData.courierName || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm font-bold text-primary">{trackingData.currentStatus}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Est. Delivery</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            {trackingData.estimatedDelivery ? new Date(trackingData.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
          <div
            className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
          ></div>
          {statusSteps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                idx <= currentStep
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {idx <= currentStep ? <i className="fas fa-check text-[10px]"></i> : idx + 1}
              </div>
              <span className={`text-[10px] mt-2 text-center ${
                idx <= currentStep ? 'text-primary font-medium' : 'text-gray-400'
              }`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking History */}
      {trackingData.checkpoints && trackingData.checkpoints.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4 uppercase tracking-wider">Tracking History</h3>
          <div className="space-y-0">
            {trackingData.checkpoints.map((checkpoint, index) => (
              <div key={index} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  {index < trackingData.checkpoints.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 my-1"></div>
                  )}
                </div>
                <div className={`pb-6 flex-1 ${index === 0 ? '' : 'opacity-70'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{checkpoint.status}</span>
                    <span className="text-xs text-gray-400">{checkpoint.date}{checkpoint.time ? ` at ${checkpoint.time}` : ''}</span>
                  </div>
                  {checkpoint.location && (
                    <p className="text-xs text-gray-500">{checkpoint.location}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
