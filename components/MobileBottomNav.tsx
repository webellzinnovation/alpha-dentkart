
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
  const navItems = [
    { id: 'home', icon: 'fa-home', label: 'Home', view: 'home' },
    { id: 'categories', icon: 'fa-grid-2', label: 'Category', view: 'categories' },
    { id: 'brands', icon: 'fa-award', label: 'Brand', view: 'brands' },
    { id: 'search', icon: 'fa-search', label: 'Search', view: 'search' },
    { id: 'wishlist', icon: 'fa-heart', label: 'Wishlist', view: 'wishlist', badge: wishlistCount, badgeColor: 'bg-accent' },
    { id: 'cart', icon: 'fa-shopping-bag', label: 'Cart', view: 'cart', badge: cartCount, badgeColor: 'bg-primary' },
  ];

  const isActive = (item: any) => {
    if (item.view === 'cart') return false; // Cart triggers overlay
    return currentView === item.view;
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 h-[calc(68px+env(safe-area-inset-bottom,0px))] pb-safe">
      <div className="flex justify-around items-center h-full px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'cart') onOpenCart();
              else if (item.id === 'search') {
                // Trigger search focus or navigate to shop
                onNavigate('shop');
                setTimeout(() => {
                  document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
                }, 100);
              }
              else onNavigate(item.view);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-[52px] rounded-2xl transition-all duration-300 relative ${isActive(item) ? 'bg-pink-50 dark:bg-pink-900/20 shadow-sm' : ''}`}
          >
            <div className="relative">
              <i className={`fas ${item.icon} ${isActive(item) ? 'text-primary scale-110' : 'text-gray-400 dark:text-gray-500'} text-lg transition-all`}></i>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`absolute -top-1.5 -right-2 ${item.badgeColor} text-white text-[8px] font-black min-w-[14px] h-[14px] flex items-center justify-center rounded-full shadow-sm ring-1 ring-white dark:ring-gray-900 px-0.5 ${item.id === 'cart' ? 'animate-bounce' : ''}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 transition-all ${isActive(item) ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>


  );
};
