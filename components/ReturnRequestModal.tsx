import React, { useState } from 'react';
import api from '../utils/api';

interface ReturnRequestModalProps {
  orderId: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({ orderId, items, onClose, onSuccess }) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Defective/Damaged product',
    'Wrong item received',
    'Product not as described',
    'Quality issue',
    'Expired product',
    'Other'
  ];

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(i => i !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return.');
      return;
    }
    if (!reason) {
      setError('Please select a reason for return.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const returnItems = items.filter(i => selectedItems.includes(i.id)).map(i => ({
        productId: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price
      }));

      await api.post('/returns', {
        orderId,
        items: returnItems,
        reason,
        description
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit return request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Request Return</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">Order #{orderId.slice(0, 8).toUpperCase()}</p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select items to return</label>
          <div className="space-y-2">
            {items.map(item => (
              <label key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedItems.includes(item.id) ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="text-primary rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{item.name}</span>
                  <span className="text-xs text-gray-500 ml-2">Qty: {item.quantity}</span>
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for return</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800"
          >
            <option value="">Select a reason</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800"
            rows={3}
          />
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <i className="fas fa-info-circle mr-1"></i>
            Returns are accepted within 15 days of delivery (30 days for dental professionals). Refunds are processed within 5-7 business days after approval.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Submit Return Request'}
          </button>
        </div>
      </div>
    </div>
  );
};
