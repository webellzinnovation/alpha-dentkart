
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  onProductClick?: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product, attributes?: Record<string, string>) => void;
  onQuickView?: (product: Product) => void;
  isInWishlist?: boolean;
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
  isInWishlist = false
}) => {
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

  return (
    <div onClick={handleClick} className="bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-xl p-3 sm:p-4 group hover:shadow-lg transition-all relative cursor-pointer flex flex-col h-full">
      {/* Badge */}
      {product.badge && (
        <span className={`absolute top-3 left-3 text-white text-[10px] px-2 py-0.5 rounded-full z-10 ${badgeColors[product.badgeColor || 'blue']}`}>
          {product.badge}
        </span>
      )}

      {/* Wishlist Button - Always visible top right */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-3 right-3 w-8 h-8 rounded-full shadow-sm flex items-center justify-center z-10 transition-colors ${isInWishlist ? 'bg-white text-red-500 border border-gray-100' : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-red-500 backdrop-blur-sm'}`}
        title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        <i className={`${isInWishlist ? 'fas' : 'far'} fa-heart text-xs`}></i>
      </button>

      <div className={`relative mb-3 ${compact ? 'h-40 sm:h-48 p-4' : 'h-32 sm:h-40'} flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0`}>
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

        <button
          onClick={handleAddToCart}
          className="w-full py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95 bg-white dark:bg-transparent"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export const ProductCard = React.memo(ProductCardComponent);
