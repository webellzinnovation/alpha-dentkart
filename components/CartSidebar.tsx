import React from 'react';
import { CartItem } from '../types';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onStartShopping: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onStartShopping
}) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-surface-dark shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <i className="fas fa-shopping-bag text-primary"></i> Shopping Cart ({cartItems.length})
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:text-primary transition-colors text-gray-500 shadow-sm">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <i className="fas fa-shopping-cart text-6xl opacity-20"></i>
              <p>Your cart is empty</p>
              <button 
                onClick={() => {
                  onClose();
                  onStartShopping();
                }} 
                className="text-primary font-medium hover:underline"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.cartItemId} className="flex gap-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center justify-center p-2 flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2 leading-tight">{item.name}</h4>
                    <span className="text-xs text-gray-500">{item.brand}</span>
                    {/* Selected Attributes */}
                    {item.selectedAttributes && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.selectedAttributes).map(([key, value]) => (
                          <span key={key} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-primary font-bold">₹{item.price.toLocaleString('en-IN')}</span>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md">
                        <button 
                          onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-medium text-gray-800 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-gray-500 mb-4 text-center">Shipping and taxes calculated at checkout.</p>
            <button className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
              <span>Checkout</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </button>
          </div>
        )}
      </div>
    </>
  );
};