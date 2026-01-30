import React, { useState, useEffect } from 'react';

interface OrderTrackingProps {
  orderId: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId }) => {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await fetch(`/api/shipping/track/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTrackingData(data.tracking);
        } else {
          setError('Failed to load tracking information');
        }
      } catch (err) {
        setError('Error loading tracking information');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">📦 No Tracking Information</div>
          <p className="text-gray-700">Tracking information is not available for this order.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600';
      case 'out-for-delivery':
        return 'text-blue-600';
      case 'in-transit':
        return 'text-yellow-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '✅';
      case 'out-for-delivery':
        return '📦';
      case 'in-transit':
        return '🚚';
      default:
        return '📋';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Tracking Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Tracking</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Order ID: {orderId}</span>
          <span className="mx-2">•</span>
          <span>Carrier: {trackingData.carrier}</span>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingData.status)}`}>
            {getStatusIcon(trackingData.status)} {trackingData.status}
          </div>
        </div>
        
        {trackingData.estimatedDelivery && (
          <div className="text-sm text-gray-600">
            Estimated Delivery: {formatDate(trackingData.estimatedDelivery)}
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h3>
        
        {trackingData.checkpoints && trackingData.checkpoints.length > 0 ? (
          <div className="space-y-4">
            {trackingData.checkpoints.map((checkpoint: any, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <div className="text-pink-600 font-bold">{index + 1}</div>
                </div>
                
                <div className="flex-1">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {formatDate(checkpoint.timestamp)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checkpoint.status)}`}>
                        {checkpoint.status}
                      </span>
                    </div>
                    
                    <div className="text-gray-700">
                      <p className="font-medium">{checkpoint.location}</p>
                      <p className="text-sm">{checkpoint.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No tracking updates available yet</p>
          </div>
        )}
      </div>

      {/* External Tracking Link */}
      {trackingData.trackingUrl && (
        <div className="mt-6 text-center">
          <a
            href={trackingData.trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors duration-200 inline-flex items-center"
          >
            Track on Carrier Website
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002 2v2a2 2 0 002-2zm3 0a1 1 0 000 2h6a1 1 0 000 2v6a1 1 0 000-2H4a2 2 0 002 2v4a1 1 0 002-2z"/>
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;