import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Product, CartItem } from '../types';

interface QuickReorderProps {
  onAddToCart: (product: Product, attributes?: Record<string, string>) => void;
  onProductClick?: (product: Product) => void;
}

interface ReorderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  orderedAt: string;
}

export const QuickReorder: React.FC<QuickReorderProps> = ({ onAddToCart, onProductClick }) => {
  const [reorders, setReorders] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const fetchReorders = async () => {
      try {
        const response = await api.get('/quick-reorder/recommended');
        setReorders(response.data.reorders || response.data.recommended || []);
      } catch {
        setReorders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReorders();
  }, []);

  const handleReorder = async (item: ReorderItem) => {
    setAdding(item.id);
    try {
      const response = await api.post('/quick-reorder', {
        orderId: item.orderId,
        items: [{ productId: item.productId, quantity: item.quantity }]
      });

      const product: Product = {
        id: Number(item.productId),
        name: item.productName,
        category: 'General',
        price: item.price,
        originalPrice: item.price,
        rating: 0,
        reviews: 0,
        image: item.productImage,
        stock: 10,
      };

      for (let i = 0; i < item.quantity; i++) {
        onAddToCart(product);
      }
    } catch (err) {
      console.error('Reorder failed:', err);
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-redo text-primary"></i>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">Quick Reorder</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (reorders.length === 0) return null;

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="fas fa-redo text-primary"></i>
          <h3 className="text-sm font-bold text-gray-800 dark:text-white">Quick Reorder</h3>
        </div>
        <span className="text-xs text-gray-400">From recent orders</span>
      </div>
      <div className="space-y-2">
        {reorders.slice(0, 3).map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-12 h-12 object-contain bg-white dark:bg-gray-700 rounded-lg p-1 cursor-pointer"
              onClick={() => onProductClick?.({
                id: Number(item.productId),
                name: item.productName,
                category: 'General',
                price: item.price,
                originalPrice: item.price,
                rating: 0,
                reviews: 0,
                image: item.productImage,
                stock: 10,
              })}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.productName}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={() => handleReorder(item)}
              disabled={adding === item.id}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-pink-700 disabled:opacity-50 flex items-center gap-1"
            >
              {adding === item.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cart-plus"></i>}
              Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
