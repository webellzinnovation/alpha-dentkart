import React from 'react';
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

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const emptyStars = 5 - fullStars;
        return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
    };

    return (
        <div
            className="product-card cursor-pointer"
            onClick={() => onClick?.(product.id)}
        >
            {/* Image */}
            <div className="product-card-image">
                <img src={product.image} alt={product.name} />
                {discount > 0 && (
                    <div className="badge-sale">{discount}% OFF</div>
                )}
            </div>

            {/* Content */}
            <div className="product-card-content">
                {/* Brand */}
                {product.brand && (
                    <div className="product-brand">{product.brand}</div>
                )}

                {/* Name */}
                <div className="product-name">{product.name}</div>

                {/* Rating */}
                {product.rating && (
                    <div className="product-rating">
                        <span className="stars">
                            {renderStars(product.rating)}
                        </span>
                        <span className="count">({product.reviewCount || 0})</span>
                    </div>
                )}

                {/* Price */}
                <div className="product-price-wrapper">
                    <span className="product-price">
                        ${product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                        <span className="product-price-original">
                            ${product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Add to Cart Button */}
                <button
                    className="btn-add-cart"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart?.(product.id);
                    }}
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
};
