import React, { useState } from 'react';
import { CartItem, User, Coupon } from '../types';
import { couponsAPI } from '../utils/api';
import OptimizedImageMemo from './OptimizedImage';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onStartShopping: () => void;
  user?: User; // User data for payment (optional)
  onCheckout?: () => void; // New prop for navigation
  onGuestCheckout?: () => void; // Guest checkout
  onLogin?: () => void;
  appliedCoupon?: Coupon | null;
  onApplyCoupon?: (coupon: Coupon | null) => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onStartShopping,
  user,
  onCheckout,
  onGuestCheckout,
  onLogin,
  appliedCoupon,
  onApplyCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else {
      discount = appliedCoupon.value;
    }
  }

  const finalTotal = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsApplying(true);
    setCouponError('');
    try {
      const coupon = await couponsAPI.validate(couponCode, subtotal);
      if (onApplyCoupon) onApplyCoupon(coupon);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.response?.data?.error || 'Invalid coupon code');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    if (onApplyCoupon) onApplyCoupon(null);
  };

  const handleCheckout = () => {
    if (!user) {
      if (onLogin) {
        onClose();
        onLogin();
      } else {
        alert('Please login to continue with payment');
      }
      return;
    }

    if (onCheckout) {
      onClose();
      onCheckout();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[90] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-surface-dark shadow-2xl transform transition-transform duration-300 z-[100] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Status Bar Filler for Mobile */}
        <div className="status-bar-filler lg:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/50"></div>

        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-surface-dark z-10">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-shopping-bag text-primary"></i>
            Your Cart ({cartItems.length})
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-shopping-basket text-4xl text-gray-300 dark:text-gray-600"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Your cart is empty</h3>
              <p className="text-gray-500 max-w-[200px]">Looks like you haven't added anything to your cart yet.</p>
              <button
                onClick={onStartShopping}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-pink-700 transition-colors shadow-lg shadow-primary/30"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 p-3 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow group">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden p-2">
                  <OptimizedImageMemo src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal hover:scale-110 transition-transform duration-300" width={80} height={80} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white truncate pr-4">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.category}</p>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="font-bold text-primary">₹{item.price.toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-shadow"
                      >
                        <i className="fas fa-minus text-[10px]"></i>
                      </button>
                      <span className="text-sm font-bold text-gray-800 dark:text-white w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-shadow"
                      >
                        <i className="fas fa-plus text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                  <div className="mb-2">
                    {/* Removed extra trash icon from previous loop implementation errors if any, kept clean structure */}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.cartItemId)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-4">
            
            {/* Coupon Section */}
            {!appliedCoupon ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon Code"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:border-primary outline-none"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !couponCode}
                    className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-gray-900 disabled:opacity-50 transition-colors"
                  >
                    {isApplying ? <i className="fas fa-spinner fa-spin"></i> : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-medium ml-1">{couponError}</p>}
              </div>
            ) : (
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800/50">
                <div className="flex items-center gap-2">
                  <i className="fas fa-tag text-green-600 text-xs"></i>
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">{appliedCoupon.code} Applied</span>
                </div>
                <button onClick={handleRemoveCoupon} className="text-green-700 dark:text-green-400 hover:text-red-500 transition-colors">
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 font-medium">Discount ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : 'Fixed'})</span>
                  <span className="font-bold text-green-600">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-800 dark:text-white font-bold">Total</span>
                <span className="text-xl font-bold text-primary">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center">Shipping and taxes calculated at checkout.</p>
            
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
            >
              <span>Checkout</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </button>
            {!user && onGuestCheckout && (
              <button
                onClick={() => { onClose(); onGuestCheckout(); }}
                className="w-full mt-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Continue as Guest
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};