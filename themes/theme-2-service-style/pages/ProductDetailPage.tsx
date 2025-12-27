import React, { useState } from 'react';
import { Product } from '../../../types';
import '../styles/theme.css';

interface ProductDetailPageProps {
    product: Product;
    onAddToCart?: (product: Product, quantity: number) => void;
    onBack?: () => void;
    relatedProducts?: Product[];
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
    product,
    onAddToCart,
    onBack,
    relatedProducts = []
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    const images = [product.image, product.image, product.image]; // Mock multiple images

    const handleAddToCart = () => {
        onAddToCart?.(product, quantity);
    };

    return (
        <div className="theme-2-service-style min-h-screen bg-[var(--t2-cream-bg)] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-[var(--t2-cream-bg)] flex items-center justify-center hover:bg-[var(--t2-orange-light)] transition-all"
                    >
                        <i className="fas fa-arrow-left text-[var(--t2-text-dark)]"></i>
                    </button>
                    <h1 className="text-lg font-bold text-[var(--t2-text-dark)] flex-1">Product Details</h1>
                    <button className="w-10 h-10 rounded-full bg-[var(--t2-cream-bg)] flex items-center justify-center">
                        <i className="fas fa-heart text-[var(--t2-text-gray)]"></i>
                    </button>
                    <button className="w-10 h-10 rounded-full bg-[var(--t2-cream-bg)] flex items-center justify-center">
                        <i className="fas fa-share-alt text-[var(--t2-text-gray)]"></i>
                    </button>
                </div>
            </header>

            {/* Image Gallery */}
            <div className="bg-white p-6">
                <div className="max-w-2xl mx-auto">
                    <img
                        src={images[selectedImage]}
                        alt={product.name}
                        className="w-full h-80 object-contain rounded-2xl mb-4"
                    />
                    <div className="flex gap-3 justify-center">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx
                                        ? 'border-[var(--t2-orange-primary)] scale-105'
                                        : 'border-gray-200'
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-4">
                {/* Name and Brand */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-[var(--t2-text-dark)] mb-2">
                                {product.name}
                            </h2>
                            <p className="text-sm text-[var(--t2-text-gray)] flex items-center gap-2">
                                <i className="fas fa-tag"></i>
                                {product.brand}
                            </p>
                        </div>
                        {product.stock > 0 && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                In Stock
                            </span>
                        )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-[var(--t2-orange-primary)]">
                            {[...Array(5)].map((_, i) => (
                                <i key={i} className={`${i < Math.floor(product.rating || 0) ? 'fas' : 'far'} fa-star`}></i>
                            ))}
                        </div>
                        <span className="text-sm text-[var(--t2-text-gray)]">
                            {product.rating} ({product.reviews} reviews)
                        </span>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[var(--t2-cream-bg)] rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-[var(--t2-orange-primary)]">{product.stock}</div>
                            <div className="text-xs text-[var(--t2-text-gray)]">In Stock</div>
                        </div>
                        <div className="bg-[var(--t2-cream-bg)] rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-[var(--t2-orange-primary)]">{product.rating}</div>
                            <div className="text-xs text-[var(--t2-text-gray)]">Rating</div>
                        </div>
                        <div className="bg-[var(--t2-cream-bg)] rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-[var(--t2-orange-primary)]">{product.reviews}</div>
                            <div className="text-xs text-[var(--t2-text-gray)]">Sold</div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[var(--t2-text-dark)] mb-3">Description</h3>
                    <p className="text-[var(--t2-text-gray)] leading-relaxed">
                        {product.description || 'High-quality dental product designed for professional use. Features premium materials and excellent durability.'}
                    </p>
                </div>

                {/* Specifications */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-[var(--t2-text-dark)] mb-3">Specifications</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-[var(--t2-text-gray)]">Category</span>
                            <span className="font-semibold text-[var(--t2-text-dark)]">{product.category}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                            <span className="text-[var(--t2-text-gray)]">Brand</span>
                            <span className="font-semibold text-[var(--t2-text-dark)]">{product.brand}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-[var(--t2-text-gray)]">SKU</span>
                            <span className="font-semibold text-[var(--t2-text-dark)]">#{product.id}</span>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-[var(--t2-text-dark)] mb-4">Related Products</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {relatedProducts.slice(0, 4).map((p) => (
                                <div key={p.id} className="border border-gray-200 rounded-xl p-3">
                                    <img src={p.image} alt={p.name} className="w-full h-24 object-contain rounded-lg mb-2" />
                                    <p className="text-xs font-semibold text-[var(--t2-text-dark)] line-clamp-2">{p.name}</p>
                                    <p className="text-sm font-bold text-[var(--t2-orange-primary)] mt-1">${p.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Bar - Price and Add to Cart */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 bg-[var(--t2-cream-bg)] rounded-full px-4 py-2">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--t2-orange-primary)] font-bold"
                        >
                            -
                        </button>
                        <span className="font-bold text-[var(--t2-text-dark)] min-w-[30px] text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--t2-orange-primary)] font-bold"
                        >
                            +
                        </button>
                    </div>

                    {/* Price and Add to Cart */}
                    <div className="flex-1 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-[var(--t2-text-gray)]">Total Price</p>
                            <p className="text-2xl font-bold text-[var(--t2-orange-primary)]">
                                ${(product.price * quantity).toFixed(2)}
                            </p>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                            className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-shopping-cart mr-2"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
