
import React from 'react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (page: any, category?: string) => void;
  onOpenCart: () => void;
  cartCount: number;
  wishlistCount: number;
  isLoggedIn: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCart,
  cartCount,
  wishlistCount,
  isLoggedIn
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 h-16 pb-safe">
      <div className="flex justify-around items-center h-full">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'home' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button
          onClick={() => onNavigate('shop')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'shop' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}
        >
          <i className="fas fa-store text-lg"></i>
          <span className="text-[10px] font-medium">Shop</span>
        </button>

        <button
          onClick={() => onNavigate('wishlist')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-colors ${currentView === 'wishlist' ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}
        >
          <div className="relative">
            <i className="fas fa-heart text-lg"></i>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5 animate-pulse">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Wishlist</span>
        </button>

        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          <div className="relative">
            <i className="fas fa-shopping-cart text-lg"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[9px] min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5 animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </button>

        <button
          onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${['dashboard', 'login', 'profile'].includes(currentView) ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary'}`}
        >
          <i className="fas fa-user text-lg"></i>
          <span className="text-[10px] font-medium">Account</span>
        </button>
      </div>
    </div>
  );
};
