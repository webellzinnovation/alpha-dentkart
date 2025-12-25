
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BrandScroll } from './components/BrandScroll';
import { ProductCard } from './components/ProductCard';
import { Shop } from './components/Shop';
import { Brands } from './components/Brands';
import { Categories } from './components/Categories';
import { Footer } from './components/Footer';
import { Wishlist } from './components/Wishlist';
import { CartSidebar } from './components/CartSidebar';
import { ProductDetail } from './components/ProductDetail';
import { ProductModal } from './components/ProductModal';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AIChat } from './components/AIChat';
import { AdminDashboard } from './components/AdminDashboard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CATEGORIES, BRAND_PROFILES, MOCK_USER, ALL_PRODUCTS, PROMOS } from './constants';
import { Product, CartItem, User, Order, Category, BrandProfile } from './types';
import { adaptDemoData } from './utils/demoDataAdapter';

type ViewState = 'home' | 'shop' | 'brands' | 'categories' | 'wishlist' | 'product-detail' | 'login' | 'dashboard' | 'admin-dashboard';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [shopCategory, setShopCategory] = useState<string | null>(null);
  const [shopBrand, setShopBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'top' | 'featured'>('new');

  // App Data State (Lifted from constants to be editable by Admin)
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_products');
    if (saved) return JSON.parse(saved);
    return ALL_PRODUCTS.map(p => ({
      ...p,
      stock: p.stock ?? Math.floor(Math.random() * 50) + 5
    }));
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('alpha_orders');
    if (saved) return JSON.parse(saved);
    return MOCK_USER.orders;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('alpha_categories');
    if (saved) return JSON.parse(saved);
    return CATEGORIES;
  });
  const [brands, setBrands] = useState<BrandProfile[]>(() => {
    const saved = localStorage.getItem('alpha_brands');
    if (saved) return JSON.parse(saved);
    return BRAND_PROFILES;
  });

  // Settings State (Lifted from AdminDashboard)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('alpha_settings');
    if (saved) return JSON.parse(saved);
    return {
      general: {
        storeName: 'Alpha Dentkart',
        logo: 'https://placehold.co/200x200/DD3B5F/white?text=Logo',
        siteIcon: 'https://placehold.co/100x100/DD3B5F/white?text=Icon',
        favicon: 'https://placehold.co/32x32/DD3B5F/white?text=F',
        supportEmail: 'support@alphadentkart.com',
        currency: 'INR',
        contactPhone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        address: '123 Dental Park, New Delhi'
      },
      payment: {
        phonepe: { enabled: true, merchantId: 'MERC123456', saltKey: 'sk_test_123456', saltIndex: '1' },
        razorpay: { enabled: false, keyId: 'rzp_test_123456', keySecret: 'secret_123456' },
        cod: { enabled: true }
      },
      shipping: {
        standardRate: 150,
        freeShippingThreshold: 5000,
        enableInternational: false
      },
      email: {
        host: 'smtp.gmail.com',
        port: 587,
        user: 'notifications@alphadentkart.com',
        pass: 'app-password-masked',
        encryption: 'TLS'
      },
      notifications: {
        orderConfirmation: true,
        orderConfirmationMessage: 'Thank you for your order! We have received it and will process it shortly.',
        orderShipped: true,
        orderShippedMessage: 'Great news! Your order has been shipped and is on its way to you.'
      }
    };
  });

  // Missing State Restoration
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('alpha_cart');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_wishlist');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Apply Site Settings (Favicon & Title)
  useEffect(() => {
    if (settings.general.storeName) {
      document.title = settings.general.storeName;
    }
    if (settings.general.favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.general.favicon;
    }
  }, [settings.general]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Persistence Sync
  useEffect(() => { localStorage.setItem('alpha_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('alpha_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('alpha_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('alpha_brands', JSON.stringify(brands)); }, [brands]);
  useEffect(() => { localStorage.setItem('alpha_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('alpha_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('alpha_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Derived State
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  // Navigation
  const navigateToShop = (category?: string, brand?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShopCategory(category || null);
    setShopBrand(brand || null);
    setCurrentView('shop');
  };

  const navigateToBrands = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('brands');
  };

  const navigateToCategories = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('categories');
  };

  const navigateToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('home');
  };

  const navigateToWishlist = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView('wishlist');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShopCategory(null);
    setShopBrand(null);
    setCurrentView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: ViewState, category?: string) => {
    if (page === 'home') navigateToHome();
    else if (page === 'brands') navigateToBrands();
    else if (page === 'categories') navigateToCategories();
    else if (page === 'wishlist') navigateToWishlist();
    else if (page === 'login') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentView('login');
    }
    else if (page === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (isAdmin) setCurrentView('admin-dashboard');
      else setCurrentView('dashboard');
    }
    else if (page === 'admin-dashboard') {
      setCurrentView('admin-dashboard');
    }
    else navigateToShop(category);
  };

  // Auth Logic
  const handleLogin = (email?: string, password?: string) => {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    if (cleanEmail === 'admin@alphadentkart.com' && cleanPassword === 'admin') {
      // Admin Login
      setUser({ ...MOCK_USER, name: 'Admin User' });
      setIsAdmin(true);
      setIsLoggedIn(true);
      setCurrentView('admin-dashboard');
    } else {
      // Normal User Login
      setUser(MOCK_USER);
      setIsAdmin(false);
      setIsLoggedIn(true);
      setCart(MOCK_USER.cart || []);
      setWishlist(MOCK_USER.wishlist || []);
      setCurrentView('dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCart([]);
    setWishlist([]);
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedData });
    }
  };

  // Logic
  const handleProductClick = (product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 6);
    });

    setSelectedProduct(product);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      let newWishlist;
      if (exists) {
        newWishlist = prev.filter(p => p.id !== product.id);
      } else {
        newWishlist = [...prev, product];
      }
      if (isLoggedIn && !isAdmin) {
        MOCK_USER.wishlist = newWishlist;
      }
      return newWishlist;
    });
  };

  const addToCart = (product: Product, selectedAttributes?: Record<string, string>) => {
    const attrString = selectedAttributes
      ? Object.entries(selectedAttributes).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}:${v}`).join('|')
      : '';
    const cartItemId = `${product.id}-${attrString}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.cartItemId === cartItemId);
      let newCart;
      if (existingIndex > -1) {
        newCart = [...prev];
        newCart[existingIndex].quantity += 1;
      } else {
        newCart = [...prev, {
          ...product,
          quantity: 1,
          selectedAttributes,
          cartItemId
        }];
      }
      if (isLoggedIn && !isAdmin) {
        MOCK_USER.cart = newCart;
      }
      return newCart;
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const newCart = prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      if (isLoggedIn && !isAdmin) {
        MOCK_USER.cart = newCart;
      }
      return newCart;
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.cartItemId !== cartItemId);
      if (isLoggedIn && !isAdmin) {
        MOCK_USER.cart = newCart;
      }
      return newCart;
    });
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const { current } = categoryScrollRef;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const renderProductSection = (
    title: string,
    sectionProducts: Product[],
    iconClass: string,
    iconBgClass: string,
    iconColorClass: string
  ) => (
    <section className="mt-8 md:mt-12">
      <div className="flex justify-between items-end mb-4 px-4 md:px-0">
        <div className="flex items-center gap-3">
          <div className={`${iconBgClass} w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center`}>
            <i className={`${iconClass} text-sm md:text-xl ${iconColorClass}`}></i>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white leading-none">{title}</h3>
        </div>
        <a onClick={() => navigateToShop()} className="text-xs md:text-sm font-semibold text-primary hover:text-pink-700 transition-colors flex items-center gap-1 cursor-pointer">
          View All <i className="fas fa-arrow-right text-[10px]"></i>
        </a>
      </div>

      {/* Horizontal Scroll on Mobile, Grid on Desktop */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 gap-3 md:grid md:grid-cols-4 md:gap-6 snap-x scrollbar-hide">
        {sectionProducts.map(product => (
          <div key={product.id} className="min-w-[180px] w-[180px] md:min-w-0 md:w-auto snap-start flex-shrink-0">
            <ProductCard
              product={product}
              compact={true}
              onProductClick={handleProductClick}
              onToggleWishlist={toggleWishlist}
              onAddToCart={addToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              isInWishlist={wishlist.some(p => p.id === product.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );

  const restorativeProducts = products.filter(p => p.category === 'Restorative').slice(0, 4);
  const endoProducts = products.filter(p => p.category === 'Endodontics').slice(0, 4);
  const equipmentProducts = products.filter(p => p.category === 'Equipment').slice(0, 4);

  // Tabbed Data Logic
  const tabProducts = useMemo(() => {
    switch (activeTab) {
      case 'top':
        return [...products].sort((a, b) => b.reviews! - a.reviews!).slice(0, 6);
      case 'featured':
        return [...products].filter(p => p.price > 5000).slice(0, 6); // Mock featured logic
      case 'new':
      default:
        return products.slice(0, 6);
    }
  }, [activeTab, products]);


  if ((currentView as ViewState) === 'admin-dashboard') {
    return (
      <AdminDashboard
        products={products}
        setProducts={setProducts}
        orders={orders}
        setOrders={setOrders}
        categories={categories}
        setCategories={setCategories}
        brands={brands}
        setBrands={setBrands}
        onLogout={handleLogout}
        onVisitSite={navigateToHome}
        settings={settings}
        setSettings={setSettings}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 lg:pb-0 bg-gray-50 dark:bg-gray-900">
      <Header
        onNavigate={handleNavigate}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        cartTotal={cartTotal}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        isLoggedIn={isLoggedIn}
        user={user}
        categories={categories}
        settings={settings}
        searchQuery={searchQuery}
        onSearch={handleSearch}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onStartShopping={() => navigateToShop()}
      />

      <ProductModal
        isOpen={!!quickViewProduct}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
      />

      <AIChat
        products={products}
        onProductClick={handleProductClick}
        userName={user?.name}
        isLoggedIn={isLoggedIn}
        onLoginRedirect={() => handleNavigate('login')}
      />

      <main className="container mx-auto px-0 md:px-4 py-4 md:py-8 space-y-8 md:space-y-12 flex-1">

        {currentView === 'home' && (
          <>
            <div className="space-y-6 md:space-y-8 px-4 md:px-0">
              <Hero onShopClick={() => navigateToShop()} />
              <BrandScroll onBrandClick={(brand) => navigateToShop(undefined, brand)} brands={brands} />
            </div>

            {/* Categories - Horizontal Scroll */}
            <section className="px-4 md:px-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">Categories</h3>
                <div className="flex gap-2 hidden md:flex">
                  <button onClick={() => scrollCategories('left')} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-primary hover:text-white transition-colors dark:text-white"><i className="fas fa-chevron-left text-xs"></i></button>
                  <button onClick={() => scrollCategories('right')} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-primary hover:text-white transition-colors dark:text-white"><i className="fas fa-chevron-right text-xs"></i></button>
                </div>
              </div>

              <div ref={categoryScrollRef} className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-2 scrollbar-hide scroll-smooth snap-x">
                {categories.map(cat => (
                  <a key={cat.id} onClick={() => navigateToShop(cat.name)} className="flex flex-col items-center min-w-[90px] md:min-w-[120px] gap-2 md:gap-4 group cursor-pointer snap-start">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-full bg-white dark:bg-surface-dark shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-all duration-300 text-2xl md:text-3xl group-hover:scale-105 group-hover:shadow-md">
                      <i className={cat.iconClass}></i>
                    </div>
                    <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-center whitespace-nowrap">{cat.name}</span>
                  </a>
                ))}
              </div>
            </section>

            {/* Dynamic Tabs Section: New Arrivals | Top Selling | Featured */}
            <section className="px-0 md:px-0">
              <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 md:mb-6 border-b border-gray-200 dark:border-gray-700 pb-0 px-4 md:px-0">
                <div className="flex gap-6 overflow-x-auto w-full md:w-auto pb-0 scrollbar-hide">
                  <button
                    onClick={() => setActiveTab('new')}
                    className={`text-base md:text-lg font-bold pb-3 -mb-[1px] whitespace-nowrap transition-colors ${activeTab === 'new' ? 'text-gray-800 dark:text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 border-b-2 border-transparent'}`}
                  >
                    New Arrivals
                  </button>
                  <button
                    onClick={() => setActiveTab('top')}
                    className={`text-base md:text-lg font-bold pb-3 -mb-[1px] whitespace-nowrap transition-colors ${activeTab === 'top' ? 'text-gray-800 dark:text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 border-b-2 border-transparent'}`}
                  >
                    Top Selling
                  </button>
                  <button
                    onClick={() => setActiveTab('featured')}
                    className={`text-base md:text-lg font-bold pb-3 -mb-[1px] whitespace-nowrap transition-colors ${activeTab === 'featured' ? 'text-gray-800 dark:text-white border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 border-b-2 border-transparent'}`}
                  >
                    Featured
                  </button>
                </div>
              </div>

              <div className="flex overflow-x-auto pb-6 px-4 md:px-0 gap-3 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-6 snap-x scrollbar-hide animate-fade-in">
                {tabProducts.map(product => (
                  <div key={product.id} className="min-w-[180px] w-[180px] md:min-w-0 md:w-auto snap-start flex-shrink-0">
                    <ProductCard
                      product={product}
                      onProductClick={handleProductClick}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={addToCart}
                      onQuickView={(p) => setQuickViewProduct(p)}
                      isInWishlist={wishlist.some(p => p.id === product.id)}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Promo Banners - Slider on Mobile */}
            <section className="px-4 md:px-0">
              <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 gap-4 md:grid md:grid-cols-3 snap-x scrollbar-hide">
                {PROMOS.map(promo => (
                  <div key={promo.id} className={`min-w-[280px] md:min-w-0 w-full ${promo.bgColorClass} rounded-2xl p-5 md:p-6 flex items-center justify-between relative overflow-hidden group snap-center shadow-sm`}>
                    <div className="z-10 w-1/2">
                      <span className={`text-[10px] font-bold uppercase bg-white dark:bg-surface-dark px-2 py-1 rounded mb-2 inline-block shadow-sm ${promo.tagColorClass}`}>{promo.tag}</span>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight mb-2">{promo.title}</h3>
                      <p className="text-primary font-bold text-sm">{promo.price}</p>
                    </div>
                    <img alt={promo.title} className="w-28 h-28 md:w-32 md:h-32 object-contain absolute -right-2 -bottom-2 md:right-4 group-hover:scale-110 transition-transform duration-500" src={promo.image} />
                  </div>
                ))}
              </div>
            </section>

            {renderProductSection('Restorative Supplies', restorativeProducts, 'fas fa-fill', 'bg-blue-600/10 dark:bg-blue-900/20', 'text-blue-600 dark:text-blue-400')}
            {renderProductSection('Endodontic Essentials', endoProducts, 'fas fa-tooth', 'bg-teal-600/10 dark:bg-teal-900/20', 'text-teal-600 dark:text-teal-400')}
            {renderProductSection('Clinical Equipment', equipmentProducts, 'fas fa-stethoscope', 'bg-cyan-600/10 dark:bg-cyan-900/20', 'text-cyan-700 dark:text-cyan-400')}

            {/* Features Info - Grid */}
            <section className="px-4 md:px-0 py-8 border-t border-gray-200 dark:border-gray-700 mt-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: 'fas fa-truck-medical', title: 'Fast Delivery', desc: 'Priority shipping' },
                  { icon: 'fas fa-certificate', title: 'Genuine', desc: '100% Authentic' },
                  { icon: 'fas fa-headset', title: 'Support', desc: 'Expert help' },
                  { icon: 'fas fa-shield-alt', title: 'Secure', desc: 'Safe payments' }
                ].map((feat, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary text-xl mb-1">
                      <i className={feat.icon}></i>
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-gray-800 dark:text-white">{feat.title}</h5>
                      <p className="text-xs text-gray-500">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Brand Logos Footer */}
            <section className="px-4 md:px-0 border-t border-gray-200 dark:border-gray-700 py-8">
              <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
                {brands.slice(0, 5).map(brand => (
                  <h2 key={brand.id} onClick={() => navigateToShop(undefined, brand.name)} className="text-lg md:text-xl font-bold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-primary transition-colors">
                    {brand.name}
                  </h2>
                ))}
              </div>
            </section>
          </>
        )}

        <div className="px-4 md:px-0">
          {currentView === 'shop' && (
            <Shop
              products={products}
              initialCategory={shopCategory}
              initialBrand={shopBrand}
              searchQuery={searchQuery}
              onProductClick={handleProductClick}
              onToggleWishlist={toggleWishlist}
              onAddToCart={addToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              wishlistIds={wishlist.map(p => p.id)}
              categories={categories}
              brands={brands}
              onSearchUpdate={setSearchQuery}
            />
          )}

          {currentView === 'brands' && (
            <Brands onBrandClick={(brand) => navigateToShop(undefined, brand)} brands={brands} />
          )}

          {currentView === 'categories' && (
            <Categories onCategoryClick={(cat) => navigateToShop(cat)} categories={categories} />
          )}

          {currentView === 'wishlist' && (
            <Wishlist
              items={wishlist}
              onProductClick={handleProductClick}
              onRemoveFromWishlist={toggleWishlist}
              onAddToCart={addToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
              onStartShopping={() => navigateToShop()}
            />
          )}

          {currentView === 'product-detail' && selectedProduct && (
            <ProductDetail
              product={selectedProduct}
              allProducts={products}
              onAddToCart={addToCart}
              onToggleWishlist={toggleWishlist}
              isInWishlist={wishlist.some(p => p.id === selectedProduct.id)}
              onProductClick={handleProductClick}
              onNavigateBack={navigateToHome}
              onCategoryClick={(category) => navigateToShop(category)}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          )}

          {currentView === 'login' && (
            <Login onLogin={handleLogin} />
          )}

          {currentView === 'dashboard' && user && (
            <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
          )}
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && currentView !== 'product-detail' && currentView !== 'login' && currentView !== 'dashboard' && (currentView as string) !== 'admin-dashboard' && (
          <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-4 px-4 md:px-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-white">Recently Viewed</h3>
              <button onClick={() => setRecentlyViewed([])} className="text-xs text-gray-500 hover:text-primary underline">Clear History</button>
            </div>
            {/* Horizontal Scroll on Mobile */}
            <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 gap-3 md:grid md:grid-cols-6 md:gap-4 snap-x scrollbar-hide">
              {recentlyViewed.map(product => (
                <div key={`recent-${product.id}`} className="min-w-[150px] w-[150px] md:min-w-0 md:w-auto snap-start flex-shrink-0">
                  <ProductCard
                    product={product}
                    compact={true}
                    onProductClick={handleProductClick}
                    onToggleWishlist={toggleWishlist}
                    onAddToCart={addToCart}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    isInWishlist={wishlist.some(p => p.id === product.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <MobileBottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlist.length}
        isLoggedIn={isLoggedIn}
      />

      {(currentView as string) !== 'admin-dashboard' && <Footer />}
    </div>
  );
}

export default App;
