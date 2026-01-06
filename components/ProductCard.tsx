

import React, { useState, useEffect } from 'react';
import { Product, ProductBadge } from '../types';
import { subscribeToProduct, unsubscribeFromProduct, isSubscribedToProduct } from '../utils/stockNotificationService';

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
    <div onClick={handleClick} className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-2xl p-3 sm:p-4 group hover:shadow-xl transition-all relative cursor-pointer flex flex-col h-full shadow-sm">
      {/* Homepage Badge (New System) */}
      {homepageBadge && (
        <span
          className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm"
          style={{ backgroundColor: homepageBadge.bgColor, color: homepageBadge.color }}
        >
          {homepageBadge.name}
        </span>
      )}

      {/* Legacy Badge (Old System - fallback) */}
      {!homepageBadge && product.badge && (
        <span className={`absolute top-3 left-3 text-white text-[10px] px-2 py-0.5 rounded-full z-10 ${badgeColors[product.badgeColor || 'blue']}`}>
          {product.badge}
        </span>
      )}

      {/* Wishlist Button - Always visible top right */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full shadow-md flex items-center justify-center z-10 transition-all ${isInWishlist ? 'bg-white text-red-500 border border-red-100 scale-110' : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-500 backdrop-blur-sm hover:scale-110'}`}
        title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <i className={`${isInWishlist ? 'fas' : 'far'} fa-heart text-sm`}></i>
      </button>

      <div className={`relative mb-3 ${compact ? 'h-48 sm:h-56 p-4' : 'h-40 sm:h-48'} flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden shrink-0`}>
        <img
          alt={product.name}
          className={`h-full object-contain mix-blend-multiply dark:mix-blend-normal ${compact ? 'group-hover:scale-110 transition-transform duration-300' : ''}`}
          src={product.image}
          loading="lazy"
        />

        {/* Quick View - Desktop Hover Only */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex">
          <button
            onClick={handleQuickView}
            className="w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-primary hover:text-white transition-colors flex items-center justify-center"
            title="Quick View"
          >
            <i className="fas fa-eye text-xs"></i>
          </button>
        </div>
      </div>

      {/* Stock Indicator - Mobile Friendly */}
      {product.stock !== undefined && product.stock < 20 && (
        <div className="mb-2 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
            <i className="fas fa-box text-[8px]"></i>
            {product.stock} Stocks Left
          </p>
        </div>
      )}

      {product.timer && (
        <div className="w-full bg-primary text-white text-[10px] sm:text-xs text-center py-1.5 rounded-md font-medium mb-3 shrink-0 shadow-sm shadow-primary/20">
          {product.timer}
        </div>
      )}

      <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide line-clamp-1">{product.category}</div>
      <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate mb-2 hover:text-primary leading-tight" title={product.name}>{product.name}</h4>

      <div className="flex items-center gap-1 mb-3">
        <div className="flex text-yellow-400 text-xs">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`${i < Math.floor(product.rating) ? 'fas' : (i < product.rating ? 'fas fa-star-half-alt' : 'far')} fa-star`}></i>
          ))}
        </div>
        {product.reviews && <span className="text-xs text-gray-400">({product.reviews})</span>}
      </div>

      <div className="mt-auto">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 mb-4">
          <span className="text-primary font-bold text-base">₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && <span className="text-gray-400 text-xs line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>}
        </div>

        {product.stock === 0 ? (
          <button
            onClick={handleNotifyMe}
            disabled={isSubscribing}
            className={`w-full py-3 min-h-[44px] text-sm font-bold rounded-lg transition-all duration-300 active:scale-95 ${isSubscribed
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-2 border-green-500'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-2 border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
              } ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubscribing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing...
              </>
            ) : isSubscribed ? (
              <>
                <i className="fas fa-check-circle mr-2"></i>
                Subscribed ✓
              </>
            ) : (
              <>
                <i className="fas fa-bell mr-2"></i>
                Notify When Available
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full py-3 min-h-[44px] text-sm font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95 bg-white dark:bg-transparent"
          >
            Add to cart
          </button>
        )}
      </div>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export const ProductCard = React.memo(ProductCardComponent);
