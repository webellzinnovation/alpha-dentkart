import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';

interface WishlistProps {
  items: Product[];
  onProductClick: (product: Product) => void;
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product, attributes?: Record<string, string>) => void;
  onQuickView: (product: Product) => void;
  onStartShopping: () => void;
}

export const Wishlist: React.FC<WishlistProps> = ({ 
  items, 
  onProductClick, 
  onRemoveFromWishlist,
  onAddToCart,
  onQuickView,
  onStartShopping
}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-dark rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-300">
          <i className="far fa-heart text-4xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-8">Save items you want to buy later.</p>
        <button 
          onClick={onStartShopping}
          className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">My Wishlist</h1>
        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
          {items.length} Items
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onProductClick={onProductClick}
            onToggleWishlist={onRemoveFromWishlist}
            onAddToCart={onAddToCart}
            onQuickView={onQuickView}
            isInWishlist={true}
          />
        ))}
      </div>
    </div>
  );
};