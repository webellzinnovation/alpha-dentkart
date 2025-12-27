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
            className="product-card"
            onClick={() => onClick?.(product.id)}
        >
            <div className="product-card-image">
                <img src={product.image} alt={product.name} />
                {discount > 0 && (
                    <div className="badge-sale">{discount}% OFF</div>
                )}
            </div>

            <div className="product-card-content">
                {product.brand && (
                    <div className="product-brand">{product.brand}</div>
                )}

                <div className="product-name">{product.name}</div>

                {product.rating && (
                    <div className="product-rating">
                        <span className="stars">
                            {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
                        </span>
                        <span className="count">({product.reviewCount || 0})</span>
                    </div>
                )}

                <div className="product-price">
                    ${product.price.toFixed(2)}
                    {product.originalPrice && (
                        <span className="product-price-original">
                            ${product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                <button
                    className="btn-cart"
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
