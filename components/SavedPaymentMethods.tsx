import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface SavedPaymentMethod {
  id: string;
  gateway: string;
  cardLast4?: string;
  cardType?: string;
  upiId?: string;
  isDefault: boolean;
  createdAt: string;
}

interface SavedPaymentMethodsProps {
  onSelect?: (method: SavedPaymentMethod) => void;
}

export const SavedPaymentMethods: React.FC<SavedPaymentMethodsProps> = ({ onSelect }) => {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const response = await api.get('/saved-payments');
      setMethods(response.data.methods || []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpi = async () => {
    if (!newUpiId.includes('@')) {
      return;
    }
    setSaving(true);
    try {
      await api.post('/saved-payments', {
        gateway: 'upi',
        upiId: newUpiId
      });
      setNewUpiId('');
      setShowAddForm(false);
      fetchMethods();
    } catch (err) {
      console.error('Failed to save payment method:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/saved-payments/${id}`);
      fetchMethods();
    } catch (err) {
      console.error('Failed to delete payment method:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/saved-payments/${id}/default`);
      fetchMethods();
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <i className="fas fa-credit-card text-primary"></i> Saved Payment Methods
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs text-primary font-medium hover:underline"
        >
          {showAddForm ? 'Cancel' : '+ Add New'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Save UPI ID for faster checkout</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newUpiId}
              onChange={e => setNewUpiId(e.target.value)}
              placeholder="yourname@upi"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800"
            />
            <button
              onClick={handleSaveUpi}
              disabled={saving || !newUpiId.includes('@')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {methods.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No saved payment methods</p>
      ) : (
        <div className="space-y-2">
          {methods.map(method => (
            <div
              key={method.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                method.isDefault
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
              onClick={() => onSelect?.(method)}
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <i className={`fas ${method.gateway === 'upi' ? 'fa-mobile-alt' : 'fa-credit-card'} text-gray-500`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {method.gateway === 'upi' ? method.upiId : `${method.cardType} •••• ${method.cardLast4}`}
                </p>
                <p className="text-xs text-gray-400">
                  {method.isDefault && <span className="text-primary font-medium">Default • </span>}
                  Added {new Date(method.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!method.isDefault && (
                  <button
                    onClick={e => { e.stopPropagation(); handleSetDefault(method.id); }}
                    className="text-xs text-gray-400 hover:text-primary p-1"
                    title="Set as default"
                  >
                    <i className="far fa-star"></i>
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(method.id); }}
                  className="text-xs text-gray-400 hover:text-red-500 p-1"
                  title="Delete"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
