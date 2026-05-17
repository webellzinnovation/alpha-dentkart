

import React, { useState, useEffect } from 'react';
import { Product, ProductBadge } from '../types';
import { subscribeToProduct, unsubscribeFromProduct, isSubscribedToProduct } from '../utils/stockNotificationService';
import OptimizedImageMemo from './OptimizedImage';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  onProductClick?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product, attributes?: Record<string, string>) => void;
  onQuickView?: (product: Product) => void;
  isInWishlist?: boolean;
  homepageBadges?: ProductBadge[]; // NEW: Pass homepage badges for custom styling
  currentUserEmail?: string; // For checking subscription status
  currentUserName?: string; // For subscribing
}

const badgeColors = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
};

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  compact,
  onProductClick,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  isInWishlist = false,
  homepageBadges = [],
  currentUserEmail,
  currentUserName
}) => {
  // Stock notification state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Check subscription status on mount and when product/user changes
  useEffect(() => {
    if (currentUserEmail && product.stock === 0) {
      setIsSubscribed(isSubscribedToProduct(product.id, currentUserEmail));
    }
  }, [product.id, currentUserEmail, product.stock]);
  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  const handleNotifyMe = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentUserEmail || !currentUserName) {
      alert('Please log in to subscribe to stock notifications');
      return;
    }

    setIsSubscribing(true);

    try {
      if (isSubscribed) {
        // Unsubscribe
        const result = unsubscribeFromProduct(product.id, currentUserEmail);
        if (result.success) {
          setIsSubscribed(false);
          alert('✅ ' + result.message);
        } else {
          alert('❌ ' + result.message);
        }
      } else {
        // Subscribe
        const result = subscribeToProduct(
          product.id,
          product.name,
          currentUserEmail,
          currentUserName
        );
        if (result.success) {
          setIsSubscribed(true);
          alert('🔔 ' + result.message);
        } else {
          alert('❌ ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error managing stock notification:', error);
      alert('❌ An error occurred. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Get homepage badge if assigned
  const homepageBadge = product.badgeId ? homepageBadges.find(b => b.id === product.badgeId && b.enabled) : null;

  return (
    <div onClick={handleClick} className="premium-card p-3 flex flex-col h-full bg-white dark:bg-surface-dark group cursor-pointer">
      {/* Badge Area */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-1">
          {homepageBadge ? (
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider"
              style={{ backgroundColor: homepageBadge.bgColor, color: homepageBadge.color }}
            >
              {homepageBadge.name}
            </span>
          ) : product.badge ? (
            <span className={`text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider ${badgeColors[product.badgeColor || 'blue']}`}>
              {product.badge}
            </span>
          ) : null}

          {product.timer && (
            <span className="text-[9px] font-bold text-primary flex items-center gap-1">
              <i className="far fa-clock"></i> {product.timer}
            </span>
          )}
        </div>

        {/* Wishlist Button - Glassmorphic */}
        <button
          onClick={handleWishlistClick}
          className={`w-8 h-8 rounded-xl shadow-sm flex items-center justify-center transition-all ${isInWishlist ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-accent hover:bg-white'}`}
        >
          <i className={`${isInWishlist ? 'fas' : 'far'} fa-heart text-xs`}></i>
        </button>
      </div>

      {/* Product Image Area */}
<div className="relative aspect-square flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl overflow-hidden mb-3">
        <OptimizedImageMemo
          src={product.image || '/placeholder-product.png'}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 mix-blend-multiply dark:mix-blend-normal"
          width={300}
          height={300}
          quality={75}
        />
      </div>

      {/* Info Area */}
      <div className="flex flex-col flex-1">
        <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">
          {typeof product.category === 'object' && product.category?.name ? product.category.name : product.category || 'General'}
        </span>
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h4>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <span className="text-xs font-black text-gray-700 dark:text-gray-300">{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
          <i className="fas fa-star text-[10px] text-yellow-400"></i>
          {product.reviews && <span className="text-[10px] text-gray-400 font-medium">({product.reviews})</span>}
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base font-black text-gray-900 dark:text-white">₹{(product.price ?? 0).toLocaleString('en-IN')}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">₹{(product.originalPrice ?? 0).toLocaleString('en-IN')}</span>
            )}
          </div>

          {product.stock === 0 ? (
            <button
              onClick={handleNotifyMe}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSubscribed ? 'bg-green-500 text-white' : 'bg-orange-100 text-orange-600'}`}
            >
              <i className={`fas ${isSubscribed ? 'fa-check' : 'fa-bell'}`}></i>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-10 h-10 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-transform"
            >
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export const ProductCard = React.memo(ProductCardComponent);
