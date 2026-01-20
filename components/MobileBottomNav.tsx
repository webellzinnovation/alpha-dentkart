
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 h-[calc(64px+env(safe-area-inset-bottom,0px))] pb-safe">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 group transition-all ${currentView === 'home' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentView === 'home' ? 'bg-primary/10' : 'group-hover:bg-gray-50'}`}>
            <i className={`fas fa-home ${currentView === 'home' ? 'text-lg' : 'text-base'}`}></i>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${currentView === 'home' ? 'opacity-100' : 'opacity-0 scale-90 group-hover:opacity-50 transition-all'}`}>Home</span>
        </button>

        <button
          onClick={() => onNavigate('shop')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 group transition-all ${currentView === 'shop' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${currentView === 'shop' ? 'bg-primary/10' : 'group-hover:bg-gray-50'}`}>
            <i className={`fas fa-grid-2 ${currentView === 'shop' ? 'text-lg' : 'text-base'}`}></i>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${currentView === 'shop' ? 'opacity-100' : 'opacity-0 scale-90 group-hover:opacity-50 transition-all'}`}>Shop</span>
        </button>

        <button
          onClick={() => onNavigate('wishlist')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 group relative transition-all ${currentView === 'wishlist' ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all relative ${currentView === 'wishlist' ? 'bg-primary/10' : 'group-hover:bg-gray-50'}`}>
            <i className={`fas fa-heart ${currentView === 'wishlist' ? 'text-lg' : 'text-base'}`}></i>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-gray-900 px-0.5">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${currentView === 'wishlist' ? 'opacity-100' : 'opacity-0 scale-90 group-hover:opacity-50 transition-all'}`}>Wishlist</span>
        </button>

        <button
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 group text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-all"
        >
          <div className="p-1.5 rounded-xl group-hover:bg-gray-50 relative transition-all">
            <i className="fas fa-shopping-bag text-base"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-gray-900 px-0.5 animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-0 scale-90 group-hover:opacity-50 transition-all">Cart</span>
        </button>

        <button
          onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 group transition-all ${['dashboard', 'login', 'profile'].includes(currentView) ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${['dashboard', 'login', 'profile'].includes(currentView) ? 'bg-primary/10' : 'group-hover:bg-gray-50'}`}>
            <i className={`fas fa-user ${['dashboard', 'login', 'profile'].includes(currentView) ? 'text-lg' : 'text-base'}`}></i>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${['dashboard', 'login', 'profile'].includes(currentView) ? 'opacity-100' : 'opacity-0 scale-90 group-hover:opacity-50 transition-all'}`}>Account</span>
        </button>
      </div>
    </div>

  );
};
