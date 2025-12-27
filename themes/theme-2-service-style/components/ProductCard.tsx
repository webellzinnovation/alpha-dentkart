import React from 'react';
import { Product } from '../../../types';
import '../styles/theme.css';

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        brand?: string;
        price: number;
        originalPrice?: number;
        image: string;
        rating?: number;
        reviewCount?: number;
        inStock?: boolean;
        badge?: string;
    };
    onAddToCart?: (productId: string) => void;
    onClick?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onClick
}) => {
    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
        <div
            className="product-card cursor-pointer"
            onClick={() => onClick?.(product.id)}
        >
            {/* Image */}
            <div className="product-card-image relative">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                />
                {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        {discount}% OFF
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="product-card-content">
                {/* Brand */}
                {product.brand && (
                    <div className="text-xs text-gray-500 mb-1">{product.brand}</div>
                )}

                {/* Title */}
                <h3 className="product-card-title line-clamp-2">
                    {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                    <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-yellow-400 text-xs">
                            {[...Array(5)].map((_, i) => (
                                <i
                                    key={i}
                                    className={`${i < Math.floor(product.rating!) ? 'fas' : 'far'} fa-star`}
                                ></i>
                            ))}
                        </div>
                        <span className="text-xs text-gray-500">
                            ({product.reviewCount || 0})
                        </span>
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="product-card-price">
                        ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                            ${product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(product.id);
                    }}
                    className="w-full bg-gray-900 text-white py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};
