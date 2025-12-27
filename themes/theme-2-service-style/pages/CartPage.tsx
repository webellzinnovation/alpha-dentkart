import React from 'react';
import { CartItem } from '../../../types';
import '../styles/theme.css';

interface CartPageProps {
    cartItems: CartItem[];
    onUpdateQuantity?: (cartItemId: string, delta: number) => void;
    onRemoveItem?: (cartItemId: string) => void;
    onCheckout?: () => void;
    onContinueShopping?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
    cartItems,
    onUpdateQuantity,
    onRemoveItem,
    onCheckout,
    onContinueShopping
}) => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    if (cartItems.length === 0) {
        return (
            <div className="theme-2-service-style min-h-screen bg-[var(--t2-cream-bg)] flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-32 h-32 bg-[var(--t2-orange-light)] rounded-full flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-shopping-cart text-[var(--t2-orange-primary)] text-5xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--t2-text-dark)] mb-2">Your cart is empty</h2>
                    <p className="text-[var(--t2-text-gray)] mb-6">Add some products to get started!</p>
                    <button onClick={onContinueShopping} className="btn-primary px-8 py-3">
                        <i className="fas fa-shopping-bag mr-2"></i>
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="theme-2-service-style min-h-screen bg-[var(--t2-cream-bg)] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onContinueShopping}
                        className="w-10 h-10 rounded-full bg-[var(--t2-cream-bg)] flex items-center justify-center"
                    >
                        <i className="fas fa-arrow-left text-[var(--t2-text-dark)]"></i>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[var(--t2-text-dark)]">My Cart</h1>
                        <p className="text-sm text-[var(--t2-text-gray)]">{cartItems.length} items</p>
                    </div>
                </div>
            </header>

            {/* Cart Items */}
            <div className="p-4 space-y-3">
                {cartItems.map((item) => (
                    <div key={item.cartItemId} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="w-24 h-24 bg-[var(--t2-cream-bg)] rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-[var(--t2-text-dark)] mb-1 line-clamp-2">
                                    {item.name}
                                </h3>
                                <p className="text-xs text-[var(--t2-text-gray)] mb-2">
                                    {item.brand || 'Generic'}
                                </p>

                                <div className="flex items-center justify-between">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2 bg-[var(--t2-cream-bg)] rounded-full px-3 py-1">
                                        <button
                                            onClick={() => onUpdateQuantity?.(item.cartItemId, -1)}
                                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[var(--t2-orange-primary)] font-bold text-sm"
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-[var(--t2-text-dark)] min-w-[20px] text-center text-sm">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => onUpdateQuantity?.(item.cartItemId, 1)}
                                            className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[var(--t2-orange-primary)] font-bold text-sm"
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-[var(--t2-orange-primary)]">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-[var(--t2-text-gray)]">
                                            ${item.price.toFixed(2)} each
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Remove Button */}
                            <button
                                onClick={() => onRemoveItem?.(item.cartItemId)}
                                className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-all flex-shrink-0"
                            >
                                <i className="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Card - Fixed Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
                <div className="p-4 space-y-3">
                    {/* Price Breakdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--t2-text-gray)]">Subtotal</span>
                            <span className="font-semibold text-[var(--t2-text-dark)]">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--t2-text-gray)]">Shipping</span>
                            <span className="font-semibold text-[var(--t2-text-dark)]">
                                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--t2-text-gray)]">Tax (10%)</span>
                            <span className="font-semibold text-[var(--t2-text-dark)]">${tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-bold text-[var(--t2-text-dark)]">Total</span>
                            <span className="text-2xl font-bold text-[var(--t2-orange-primary)]">
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Free Shipping Notice */}
                    {shipping > 0 && (
                        <div className="bg-[var(--t2-orange-light)] rounded-xl p-3 text-center">
                            <p className="text-xs text-[var(--t2-orange-primary)] font-semibold">
                                Add ${(500 - subtotal).toFixed(2)} more for FREE shipping! 🚚
                            </p>
                        </div>
                    )}

                    {/* Checkout Button */}
                    <button
                        onClick={onCheckout}
                        className="btn-primary w-full py-4 text-lg"
                    >
                        <i className="fas fa-lock mr-2"></i>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};
