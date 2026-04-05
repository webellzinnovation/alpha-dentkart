import React, { useEffect, useState } from 'react';
import api from '../utils/api';

interface InvoiceViewerProps {
  orderId: string;
  onClose?: () => void;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ orderId, onClose }) => {
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await api.get(`/invoice/${orderId}`, { responseType: 'text' });
        setInvoiceHtml(response.data);
      } catch (err: any) {
        console.error('Invoice fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [orderId]);

  const handleDownload = () => {
    const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || '/api/v1';
    window.open(`${API_BASE_URL}/invoice/${orderId}?download=true`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Invoice #{orderId.slice(0, 8).toUpperCase()}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-pink-700"
            >
              <i className="fas fa-download mr-1"></i> Download
            </button>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5">
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        <div className="h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="fas fa-file-invoice text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">{error}</p>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: invoiceHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
