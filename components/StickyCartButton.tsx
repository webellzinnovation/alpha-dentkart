
import React from 'react';

interface StickyCartButtonProps {
    cartCount: number;
    cartTotal: number;
    onOpenCart: () => void;
    currency?: string;
}

export const StickyCartButton: React.FC<StickyCartButtonProps> = ({
    cartCount,
    cartTotal,
    onOpenCart,
    currency = 'INR'
}) => {
    if (cartCount === 0) return null;

    return (
        <div className="lg:hidden fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[60] px-4 pb-4 pointer-events-none">
            <button
                onClick={onOpenCart}
                className="w-full bg-gradient-to-r from-primary to-pink-600 text-white rounded-2xl shadow-2xl shadow-primary/40 flex items-center justify-between px-6 py-4 pointer-events-auto active:scale-98 transition-transform"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <i className="fas fa-shopping-cart text-lg"></i>
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-medium opacity-90">View your cart</p>
                        <p className="text-sm font-bold">{cartCount} {cartCount === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-black">
                        {currency === 'INR' ? '₹' : currency}
                        {cartTotal.toLocaleString('en-IN')}
                    </span>
                    <i className="fas fa-arrow-right text-sm"></i>
                </div>
            </button>
        </div>
    );
};
