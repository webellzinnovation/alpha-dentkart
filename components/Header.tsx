
import React, { useState, useEffect } from 'react';
import { User, Category, Product } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface HeaderProps {
  onNavigate: (page: 'home' | 'shop' | 'brands' | 'categories' | 'wishlist' | 'login' | 'dashboard', category?: string) => void;
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  onOpenCart: () => void;
  isLoggedIn: boolean;
  user: User | null;
  categories: Category[];
  settings: any;
  searchQuery: string;
  onSearch: (query: string) => void;
  recentlyViewed: Product[];
  onProductClick: (product: Product) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  cartCount,
  cartTotal,
  wishlistCount,
  onOpenCart,
  isLoggedIn,
  user,
  categories,
  settings,
  searchQuery,
  onSearch,
  recentlyViewed,
  onProductClick
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isRecentlyViewedOpen, setIsRecentlyViewedOpen] = useState(false);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Bar - Desktop Only */}
      <div className="bg-gray-900 text-white text-[11px] py-2 hidden lg:block tracking-wide">
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center">
          <div className="flex space-x-6 opacity-80">
            <span><i className="fas fa-globe-asia mr-1"></i> {settings.general.currency === 'INR' ? 'India (INR)' : settings.general.currency}</span>
            <span><i className="fas fa-truck mr-1"></i> Free Shipping &gt; ₹2000</span>
          </div>
          <div className="flex space-x-8 font-medium">
            <a className="hover:text-primary cursor-pointer transition-colors">Daily Deals</a>
            <a className="hover:text-primary cursor-pointer transition-colors">Support</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-gray-200/50 dark:border-gray-700/50 py-3'
          : 'bg-white dark:bg-surface-dark border-transparent dark:border-gray-800 pt-4 sm:pt-6'
          }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          {/* Mobile Header Layout */}
          <div className="lg:hidden flex items-center justify-between py-3">
            {/* Left: Menu Icon */}
            <button
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <i className="fas fa-bars text-base"></i>
            </button>

            {/* Center: Logo */}
            <a onClick={() => onNavigate('home')} className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform">
              <img
                src="/Alpha-dentkart-logo-600p.png"
                alt="Alpha DentKart"
                className="h-9 object-contain"
              />
            </a>

            {/* Right: Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${isSearchOpen ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              <i className={`fas ${isSearchOpen ? 'fa-times' : 'fa-search'} text-base`}></i>
            </button>
          </div>

          {/* Desktop Header Layout */}
          <div className="hidden lg:flex items-center justify-between gap-4 lg:gap-8 xl:gap-12">

            {/* Logo */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <a onClick={() => onNavigate('home')} className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform origin-left">
                <img
                  src="/Alpha-dentkart-logo-600p.png"
                  alt="Alpha DentKart"
                  className="h-10 sm:h-12 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </a>
            </div>

            {/* Search Bar - Desktop (Centered/Left aligned) */}
            <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-2xl xl:max-w-3xl mx-4 xl:mx-6 bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all items-center">
              <div className="w-36 lg:w-44 flex-shrink-0 border-r border-gray-300 dark:border-gray-600 relative h-full">
                <CustomDropdown
                  value="All Categories"
                  onChange={() => { }}
                  options={['All Categories', ...categories.map(c => c.name)]}
                  className="rounded-l-full rounded-r-none border-none h-full bg-transparent text-xs font-medium focus:ring-0 pl-4 pr-2 flex items-center"
                  bgColor="bg-gray-100 dark:bg-gray-800"
                />
              </div>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 focus:border-none outline-none px-4 text-sm text-gray-800 dark:text-white placeholder-gray-400 h-full"
                placeholder="Search products..."
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button type="submit" className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-primary transition-colors hover:bg-white dark:hover:bg-gray-700 shadow-sm">
                <i className="fas fa-search text-sm"></i>
              </button>
            </form>

            {/* Desktop Icons / Actions */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-10 flex-shrink-0">

              {/* WhatsApp / Support */}
              <a
                href={`https://wa.me/${settings.general.whatsapp ? settings.general.whatsapp.replace(/[^0-9]/g, '') : settings.general.contactPhone?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 xl:gap-4 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center group-hover:bg-pink-100 dark:group-hover:bg-pink-900/40 transition-colors">
                  <i className="fab fa-whatsapp text-xl text-primary dark:text-pink-400"></i>
                </div>
                <div className="flex flex-col leading-tight hidden xl:flex">
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Need Help?</span>
                  <span className="text-sm font-bold text-primary dark:text-pink-400 group-hover:opacity-80 transition-opacity">
                    {settings.general.whatsapp || settings.general.contactPhone}
                  </span>
                </div>
              </a>

              {/* Account */}
              <a onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')} className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <i className="far fa-user text-xl text-gray-700 dark:text-white group-hover:text-primary transition-colors"></i>
                </div>
                <div className="flex flex-col leading-tight hidden xl:flex">
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">My Account</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate max-w-[100px]">
                    {isLoggedIn && user ? user.name.split(' ')[0] : 'Log In'}
                  </span>
                </div>
              </a>

              {/* Wishlist */}
              <a onClick={() => onNavigate('wishlist')} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <i className="far fa-heart text-xl text-gray-700 dark:text-white group-hover:text-primary transition-colors"></i>
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-gray-900 shadow-sm group-hover:scale-110 transition-transform">
                    {wishlistCount}
                  </span>
                </div>
                <div className="flex flex-col leading-tight hidden xl:flex">
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Wishlist</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {wishlistCount} Items
                  </span>
                </div>
              </a>

              {/* Cart */}
              <a onClick={onOpenCart} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <i className="fas fa-shopping-cart text-lg text-gray-700 dark:text-white group-hover:text-primary transition-colors"></i>
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white dark:border-gray-900 shadow-sm group-hover:scale-110 transition-transform">
                    {cartCount}
                  </span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Cart</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {settings.general.currency === 'INR' ? '₹' : settings.general.currency}
                    {cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        <div className={`lg:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 ease-in-out ${isSearchOpen ? 'max-h-20 opacity-100 py-3' : 'max-h-0 opacity-0 py-0'}`}>
          <div className="container mx-auto px-4">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <input
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-white transition-all shadow-inner"
                placeholder="Search for products, brands..."
                autoFocus={isSearchOpen}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <i className="fas fa-search absolute left-3.5 top-3 text-gray-400 text-xs group-focus-within:text-primary transition-colors"></i>
            </form>
          </div>
        </div>

        {/* Desktop Navbar */}
        <nav className="border-t border-gray-100 dark:border-gray-800 hidden lg:block bg-white dark:bg-surface-dark mt-4">
          <div className="container mx-auto px-4 lg:px-8">
            <ul className="flex items-center justify-between py-0 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-10">
                <li className="relative group -mb-[1px]">
                  <button className="flex items-center gap-2 bg-primary text-white px-5 py-4 font-bold hover:bg-pink-700 transition-colors tracking-wide rounded-t-lg shadow-lg shadow-primary/20 transform translate-y-[1px] text-sm whitespace-nowrap">
                    <i className="fas fa-bars"></i> SHOP BY CATEGORY
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 w-72 bg-white dark:bg-surface-dark shadow-2xl rounded-b-xl py-3 hidden group-hover:block border border-gray-100 dark:border-gray-700 z-50 animate-fade-in">
                    {categories.map(cat => (
                      <a
                        key={cat.id}
                        onClick={() => onNavigate('shop', cat.name)}
                        className="px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors cursor-pointer flex items-center gap-4 text-gray-600 dark:text-gray-300 border-b border-gray-50 dark:border-gray-800 last:border-0 group/item"
                      >
                        <i className={`${cat.iconClass} w-6 text-center text-gray-400 group-hover/item:text-primary transition-colors`}></i>
                        <span className="font-medium">{cat.name}</span>
                        <i className="fas fa-chevron-right ml-auto text-[10px] text-gray-300 opacity-0 group-hover/item:opacity-100 transition-opacity"></i>
                      </a>
                    ))}
                    <a
                      onClick={() => onNavigate('categories')}
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-colors cursor-pointer flex items-center gap-4 text-primary border-t border-gray-100 dark:border-gray-700 font-bold bg-gray-50/50 rounded-b-xl"
                    >
                      <i className="fas fa-th-large w-6 text-center"></i>
                      View All Categories
                    </a>
                  </div>
                </li>
                <li><a onClick={() => onNavigate('home')} className="hover:text-primary transition-colors cursor-pointer py-4 block border-b-2 border-transparent hover:border-primary font-semibold">Home</a></li>
                <li><a onClick={() => onNavigate('shop')} className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer py-4 block border-b-2 border-transparent hover:border-primary font-semibold">Shop</a></li>
                <li><a onClick={() => onNavigate('brands')} className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer py-4 block border-b-2 border-transparent hover:border-primary font-semibold">Brands</a></li>
                <li><a onClick={() => onNavigate('shop')} className="hover:text-primary transition-colors flex items-center gap-2 cursor-pointer py-4 block border-b-2 border-transparent hover:border-primary text-primary font-bold"><i className="fas fa-fire-alt animate-pulse"></i> New Arrivals</a></li>
              </div>

              {/* Recently Viewed - Right Side */}
              <li className="relative">
                <button
                  onClick={() => setIsRecentlyViewedOpen(!isRecentlyViewedOpen)}
                  onBlur={() => setTimeout(() => setIsRecentlyViewedOpen(false), 200)}
                  className="hover:text-primary transition-colors flex items-center gap-2 cursor-pointer py-4 border-b-2 border-transparent hover:border-primary font-semibold"
                >
                  <i className="fas fa-history"></i> Recently Viewed
                  {recentlyViewed.length > 0 && (
                    <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {recentlyViewed.length}
                    </span>
                  )}
                </button>

                {/* Recently Viewed Dropdown */}
                {isRecentlyViewedOpen && recentlyViewed.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-sm text-gray-800 dark:text-white">Recently Viewed</h3>
                    </div>
                    <div className="p-2">
                      {recentlyViewed.slice(0, 5).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            onProductClick(product);
                            setIsRecentlyViewedOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded border border-gray-200 dark:border-gray-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {settings.general.currency === 'INR' ? '₹' : settings.general.currency}
                              {product.price.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar (Right) */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div
        className={`fixed inset-y-0 right-0 w-[280px] bg-gradient-to-b from-white via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-2xl z-[70] transform transition-all duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Sidebar Header - Gradient */}
        <div className="relative p-6 bg-gradient-to-r from-primary to-pink-600 overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="font-black text-2xl text-white block drop-shadow-lg">Menu</span>
              <span className="text-xs text-white/90 font-medium mt-1 block">{settings.general.storeName}</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-90 shadow-lg"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {/* Main Navigation */}
          <div className="mb-3">
            <h3 className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 px-1">Navigate</h3>
            <nav className="flex flex-col gap-1">
              {[
                { label: 'Home', action: () => onNavigate('home'), icon: 'fas fa-home', color: 'from-blue-500 to-blue-600' },
                { label: 'Shop Products', action: () => onNavigate('shop'), icon: 'fas fa-store', color: 'from-purple-500 to-purple-600' },
                { label: 'Categories', action: () => onNavigate('categories'), icon: 'fas fa-th-large', color: 'from-green-500 to-green-600' },
                { label: 'Brands', action: () => onNavigate('brands'), icon: 'fas fa-tags', color: 'from-orange-500 to-orange-600' },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    setIsMobileMenuOpen(false);
                  }}
                  className="group flex items-center gap-2.5 px-2.5 py-2 text-left rounded-lg transition-all font-medium bg-white dark:bg-gray-800 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] border border-gray-100 dark:border-gray-700 text-sm"
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                    <i className={`${item.icon} text-xs`}></i>
                  </div>
                  <span className="text-gray-800 dark:text-white">{item.label}</span>
                  <i className="fas fa-chevron-right text-[9px] text-gray-300 ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all"></i>
                </button>
              ))}
            </nav>
          </div>

          {/* Special Section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">Special</h3>
            <nav className="flex flex-col gap-2">
              {[
                { label: 'New Arrivals', action: () => onNavigate('shop'), icon: 'fas fa-fire', gradient: true },
                { label: 'My Wishlist', action: () => onNavigate('wishlist'), icon: 'fas fa-heart', count: wishlistCount },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`group flex items-center gap-4 px-4 py-3.5 text-left rounded-2xl transition-all font-semibold hover:scale-[1.02] active:scale-[0.98] ${item.gradient
                    ? 'bg-gradient-to-r from-primary to-pink-600 text-white shadow-lg shadow-primary/30'
                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg'
                    }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${item.gradient
                    ? 'bg-white/20 backdrop-blur-sm text-white'
                    : 'bg-gradient-to-br from-red-500 to-pink-600 text-white'
                    }`}>
                    <i className={`${item.icon} text-lg ${item.gradient ? 'animate-pulse' : ''}`}></i>
                  </div>
                  <span className={item.gradient ? 'text-white' : 'text-gray-800 dark:text-white'}>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-auto bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {item.count}
                    </span>
                  )}
                  {!item.count && (
                    <i className={`fas fa-chevron-right text-xs ml-auto group-hover:translate-x-1 transition-all ${item.gradient ? 'text-white/70' : 'text-gray-300 group-hover:text-primary'
                      }`}></i>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar User Section */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 pb-safe">
          {isLoggedIn && user ? (
            <div
              className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all active:scale-[0.99]"
              onClick={() => {
                onNavigate('dashboard');
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">View Profile & Orders</p>
              </div>
              <i className="fas fa-chevron-right text-xs text-gray-400"></i>
            </div>
          ) : (
            <button
              onClick={() => {
                onNavigate('login');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-primary to-pink-600 text-white py-3 rounded-xl font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:scale-[1.01] transition-all active:scale-[0.99]"
            >
              <i className="fas fa-sign-in-alt"></i>
              Login / Register
            </button>
          )}
        </div>
      </div>
    </>
  );
};
