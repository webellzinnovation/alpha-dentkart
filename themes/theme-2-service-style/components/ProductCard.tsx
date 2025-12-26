import React from 'react';
import '../styles/theme.css';

interface Product {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    image: string;
    rating: number;
    reviewCount: number;
    inStock: boolean;
    badge?: string;
}

interface ProductCardProps {
    product: Product;
    onAddToCart?: (productId: string) => void;
    onClick?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onClick
}) => {
    const discountPercentage = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    const handleCardClick = () => {
        onClick?.(product.id);
    };

    const handleAddToCart = (e: React.Event<HTMLButtonElement>) => {
        e.stopPropagation();
        onAddToCart?.(product.id);
    };

    return (
        <div
            onClick={handleCardClick}
            className="card cursor-pointer group"
        >
            {/* Product Image */}
            <div className="relative mb-3 overflow-hidden rounded-xl">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Badge */}
                {product.badge && (
                    <div className="absolute top-2 left-2 badge">
                        {product.badge}
                    </div>
                )}

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-2 right-2 bg-[var(--t2-red-error)] text-white px-2 py-1 rounded-lg text-xs font-bold">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Out of Stock Overlay */}
                {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white text-[var(--t2-text-dark)] px-4 py-2 rounded-full font-bold text-sm">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="space-y-2">
                {/* Product Name */}
                <h3 className="font-bold text-[var(--t2-text-dark)] text-sm line-clamp-2 min-h-[40px]">
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="rating">
                    {[...Array(5)].map((_, i) => (
                        <i
                            key={i}
                            className={`${i < Math.floor(product.rating) ? 'fas' : 'far'} fa-star`}
                        ></i>
                    ))}
                    <span className="text-[var(--t2-text-gray)] ml-1">
                        ({product.reviewCount})
                    </span>
                </div>

                {/* Brand */}
                <p className="text-xs text-[var(--t2-text-gray)]">
                    <i className="fas fa-tag mr-1"></i>
                    {product.brand}
                </p>

                {/* Price and Add to Cart */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-[var(--t2-orange-primary)]">
                            ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                            <span className="text-xs text-[var(--t2-text-light)] line-through">
                                ${product.originalPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={!product.inStock}
                        className={`
              px-4 py-2 rounded-full font-semibold text-sm transition-all
              ${product.inStock
                                ? 'bg-[var(--t2-orange-primary)] text-white hover:bg-[var(--t2-orange-secondary)] hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }
            `}
                    >
                        <i className="fas fa-plus mr-1"></i>
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};
