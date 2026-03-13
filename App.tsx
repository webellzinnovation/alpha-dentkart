
import React, { useRef, useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Loading } from './components/Loading';
import { BrandScroll } from './components/BrandScroll';
import { ProductCard } from './components/ProductCard';
const Shop = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));
import { Brands } from './components/Brands';
import { Categories } from './components/Categories';
import { Footer } from './components/Footer';
const Wishlist = lazy(() => import('./components/Wishlist').then(m => ({ default: m.Wishlist })));
import { CartSidebar } from './components/CartSidebar';
import { ProductModal } from './components/ProductModal';
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));

// Lazy load heavy components for code splitting
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const AIChat = lazy(() => import('./components/AIChat'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const Theme2Demo = lazy(() => import('./components/Theme2Demo'));
const Theme3Demo = lazy(() => import('./components/Theme3Demo'));
import { MobileBottomNav } from './components/MobileBottomNav';
import { StickyCartButton } from './components/StickyCartButton';
// Lazy load heavy components for code splitting
const Checkout = lazy(() => import('./components/Checkout'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const AdminLogin = lazy(() => import('./components/AdminLogin').then(m => ({ default: m.AdminLogin })));
import CookieConsent from './components/CookieConsent';
import { PROMOS, HERO_SLIDES, ALL_PRODUCTS, CATEGORIES, BRAND_PROFILES } from './constants';
import { Product, CartItem, User, Order, Category, BrandProfile, HeroSlide, PromotionalTile } from './types';
// import { adaptDemoData } from './utils/demoDataAdapter';
import { createUniqueSlug, extractIdFromSlug, generateSlug } from './utils/slugify';
// import { MOCK_USER } from './data/mockData';
import { ordersAPI } from './utils/api';

type ViewState = 'home' | 'shop' | 'brands' | 'categories' | 'wishlist' | 'product-detail' | 'login' | 'dashboard' | 'admin-dashboard' | 'admin-login' | 'theme2-demo' | 'theme3-demo' | 'checkout' | 'privacy-policy' | 'terms-of-service';

function App() {
  // Initialize view from URL
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const path = window.location.pathname.substring(1); // remove leading slash
    if (path === '' || path === 'home') return 'home';
    if (path === 'shop') return 'shop';
    if (path === 'brands') return 'brands';
    if (path === 'categories') return 'categories';
    if (path === 'wishlist') return 'wishlist';
    if (path === 'login') return 'login';
    if (path === 'dashboard') return 'dashboard';
    if (path === 'admin') return 'admin-dashboard';
    if (path === 'admin-login') return 'admin-login';
    if (path === 'checkout') return 'checkout';
    if (path === 'privacy-policy') return 'privacy-policy';
    if (path === 'terms-of-service') return 'terms-of-service';
    return 'home';
  });

  // Sync URL with View State
  useEffect(() => {
    const path = currentView === 'home' ? '/' : `/${currentView}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [currentView]);
  const [shopCategory, setShopCategory] = useState<string | null>(null);
  const [shopBrand, setShopBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'top' | 'featured'>('new');
  const [isDataLoading, setIsDataLoading] = useState(true);

  // App Data State (Initially Empty - Populated by Migration Data)
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('alpha_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [promotionalTiles, setPromotionalTiles] = useState<PromotionalTile[]>([]);

  // Load Real Data from Secure Backend API
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const { productsAPI, categoriesAPI, brandsAPI, authAPI, heroSlidesAPI, promotionalTilesAPI, usersAPI, ordersAPI, settingsAPI, reviewsAPI } = await import('./utils/api');

        // Fetch critical data first (products, categories, settings) - stagger to avoid cold start overload
        const criticalData = await Promise.allSettled([
          productsAPI.getAll({ limit: 5000 }),
          categoriesAPI.getAll(),
          settingsAPI.get(),
        ]);

        // Then load secondary data
        const secondaryData = await Promise.allSettled([
          brandsAPI.getAll(),
          authAPI.me(),
          heroSlidesAPI.getAll(),
          promotionalTilesAPI.getAll(),
        ]);

        // Load admin data (orders, users, reviews) - lower priority
        const adminData = await Promise.allSettled([
          usersAPI.getAll({ limit: 500 }),
          ordersAPI.getAllAdmin({ limit: 500 }),
          reviewsAPI.getAllAdmin()
        ]);

        console.log("Loading secure backend data...");

        // Helper to extract data from PromiseSettledResult
        const getData = (result: PromiseSettledResult<any>, key: string): any[] => {
          if (result.status === 'fulfilled' && result.value) {
            return result.value[key] || result.value.data || [];
          }
          return [];
        };

        const getUserData = (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && result.value) {
            return result.value.user || null;
          }
          return null;
        };

        const products = getData(criticalData[0], 'products');
        const categories = getData(criticalData[1], 'categories');
        const settingsData = criticalData[2].status === 'fulfilled' ? criticalData[2].value : null;
        
        const brands = getData(secondaryData[0], 'brands');
        const meUser = getUserData(secondaryData[1]);
        const heroSlides = getData(secondaryData[2], 'slides');
        const promoTiles = getData(secondaryData[3], 'tiles');
        
        const users = getData(adminData[0], 'users');
        const orders = getData(adminData[1], 'orders');
        const reviews = getData(adminData[2], 'reviews');

        if (products && products.length > 0) {
          setProducts(products);
        } else {
          setProducts([]);
        }

        if (categories && categories.length > 0) {
          // Add slug and default icons for UI
          setCategories(categories.map((cat: any) => ({
            ...cat,
            slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
            iconClass: cat.iconClass || 'fas fa-teeth'
          })));
        } else {
          setCategories([]);
        }

        if (brands && brands.length > 0) {
          setBrands(brands.map((brand: any) => ({
            ...brand,
            logo: brand.logo || `https://placehold.co/200x200?text=${brand.name}`,
            productCount: brand.productCount || 0
          })));
        } else {
          setBrands([]);
        }

        if (heroSlides && heroSlides.length > 0) {
          setHeroSlides(heroSlides);
        } else {
          setHeroSlides([]);
        }

        if (promoTiles && promoTiles.length > 0) {
          setPromotionalTiles(promoTiles);
        } else {
          setPromotionalTiles([]);
        }

        if (users && users.length > 0) {
          setUsers(users);
        } else {
          setUsers([]);
        }

        if (orders && orders.length > 0) {
          setOrders(orders);
        } else {
          // Check localStorage as fallback for orders
          const savedOrders = localStorage.getItem('alpha_orders');
          if (savedOrders) {
            setOrders(JSON.parse(savedOrders));
          }
        }

        if (reviews && reviews.length > 0) {
          setReviews(reviews);
        } else {
          setReviews([]);
        }

        // Apply settings from API if available
        if (settingsData && typeof settingsData === 'object') {
          setSettings((prev: any) => ({
            ...prev,
            ...settingsData,
            // Preserve WhatsApp settings if not in API response
            whatsapp: settingsData.whatsapp || prev.whatsapp
          }));
        }

        if (meUser && !localStorage.getItem('alpha_user')) {
          // Only set user from API if not already restored from localStorage
          setUser(meUser);
          setIsAdmin(meUser.role === 'admin');
          localStorage.setItem('isAdmin', meUser.role === 'admin' ? 'true' : 'false');
          setIsLoggedIn(true);
        }
        // This line was duplicated and should be part of the above if block or handled differently
        // setIsAdmin(meData.user.role === 'admin');


        setIsDataLoading(false);
      } catch (err) {
        console.warn("SECURE BACKEND UNREACHABLE - Using fallback constants", err);
        // setProducts(ALL_PRODUCTS);
        setProducts([]);
        // setCategories(CATEGORIES.map(cat => ({ ...cat, slug: cat.name.toLowerCase().replace(/\s+/g, '-') })));
        setCategories([]);
        // setBrands(BRAND_PROFILES);
        setBrands([]);
        // setHeroSlides(HERO_SLIDES);
        setHeroSlides([]);
        setIsDataLoading(false);
      }
    };

    loadAppData();
  }, []);

  // React Router navigation
  const navigate = useNavigate();
  const isInitialMount = useRef(true);

  // Sync URL with state for all pages
  useEffect(() => {
    // Wait for data to load before syncing URL
    if (products.length === 0) return;

    const path = window.location.pathname;

    // Product detail: /product/colgate-periogard-toothbrush-38243
    const productMatch = path.match(/^\/product\/(.+)$/);
    if (productMatch) {
      const slug = productMatch[1];
      const productId = extractIdFromSlug(slug);
      if (productId) {
        // Convert string ID to number for comparison
        const product = products.find(p => p.id === Number(productId));
        if (product) {
          setSelectedProduct(product);
          setCurrentView('product-detail');
          return;
        }
      }
      // navigate('/');
      // return;
    }

    // Brand page: /brand/colgate
    const brandMatch = path.match(/^\/brand\/(.+)$/);
    if (brandMatch) {
      const brandSlug = brandMatch[1];
      const brand = brands.find(b => generateSlug(b.name) === brandSlug);
      if (brand) {
        setShopBrand(brand.name);
        setShopCategory(null);
        setCurrentView('shop');
        return;
      }
    }

    // Category page: /category/dental-care
    const categoryMatch = path.match(/^\/category\/(.+)$/);
    if (categoryMatch) {
      const categorySlug = categoryMatch[1];
      const category = categories.find(c => generateSlug(c.name) === categorySlug);
      if (category) {
        setShopCategory(category.name);
        setShopBrand(null);
        setCurrentView('shop');
        return;
      }
    }

    // Other pages
    if (path === '/shop') {
      setCurrentView('shop');
      setShopCategory(null);
      setShopBrand(null);
    } else if (path === '/brands') {
      setCurrentView('brands');
    } else if (path === '/categories') {
      setCurrentView('categories');
    } else if (path === '/wishlist') {
      setCurrentView('wishlist');
    } else if (path === '/login') {
      setCurrentView('login');
    } else if (path === '/dashboard') {
      setCurrentView('dashboard');
    } else if (path === '/admin') {
      setCurrentView('admin-dashboard');
    } else if (path === '/theme2-demo') {
      setCurrentView('theme2-demo');
    } else if (path === '/theme3-demo') {
      setCurrentView('theme3-demo');
    } else if (path === '/privacy-policy') {
      setCurrentView('privacy-policy');
    } else if (path === '/terms-of-service') {
      setCurrentView('terms-of-service');
    } else if (path === '/') {
      setCurrentView('home');
    }
  }, [products, brands, categories, navigate]);

  // Update URL when view/product/brand/category changes
  useEffect(() => {
    // Skip URL updates on initial mount to prevent redirects
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Also wait for data to load to prevent race condition
    if (products.length === 0) return;

    let newPath = '/';

    if (currentView === 'product-detail' && selectedProduct) {
      newPath = `/product/${createUniqueSlug(selectedProduct.name, selectedProduct.id)}`;
    } else if (currentView === 'shop') {
      if (shopBrand) {
        const brand = brands.find(b => b.name === shopBrand);
        if (brand) {
          newPath = `/brand/${generateSlug(brand.name)}`;
        } else {
          newPath = '/shop';
        }
      } else if (shopCategory) {
        const category = categories.find(c => c.name === shopCategory);
        if (category) {
          newPath = `/category/${generateSlug(category.name)}`;
        } else {
          newPath = '/shop';
        }
      } else {
        newPath = '/shop';
      }
    } else if (currentView === 'brands') {
      newPath = '/brands';
    } else if (currentView === 'categories') {
      newPath = '/categories';
    } else if (currentView === 'wishlist') {
      newPath = '/wishlist';
    } else if (currentView === 'login') {
      newPath = '/login';
    } else if (currentView === 'dashboard') {
      newPath = '/dashboard';
    } else if (currentView === 'admin-dashboard') {
      newPath = '/admin';
    } else if (currentView === 'home') {
      newPath = '/';
    } else if (currentView === 'checkout') {
      newPath = '/checkout';
    } else if (currentView === 'privacy-policy') {
      newPath = '/privacy-policy';
    } else if (currentView === 'terms-of-service') {
      newPath = '/terms-of-service';
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [currentView, selectedProduct, shopBrand, shopCategory, brands, categories]);

  // Settings State (Lifted from AdminDashboard)
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('alpha_settings');
    if (saved) return JSON.parse(saved);
    return {
      general: {
        storeName: 'Alpha Dentkart',
        logo: '/Alpha-dentkart-logo-600p.png',
        siteIcon: '/Alpha-dentkart-logo-icon.png',
        favicon: '/Alpha-dentkart-logo-icon.png',
        supportEmail: 'support@alphadentkart.com',
        currency: 'INR',
        contactPhone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        address: '123 Dental Park, New Delhi'
      },
      payment: {
        phonepe: { enabled: false, merchantId: '', saltKey: '', saltIndex: '' },
        razorpay: { enabled: false, keyId: '', keySecret: '' },
        cod: { enabled: true }
      },
      shipping: {
        standardRate: 150,
        freeShippingThreshold: 5000,
        enableInternational: false
      },
      email: {
        host: '',
        port: 587,
        user: '',
        pass: '',
        encryption: 'TLS'
      },
      whatsapp: {
        enabled: false,
        phoneNumberId: '',
        accessToken: '',
        businessAccountId: ''
      },
      notifications: {
        orderConfirmation: true,
        orderConfirmationMessage: 'Thank you for your order! We have received it and will process it shortly.',
        orderShipped: true,
      }
    };
  });



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
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  // Cleanup lingering demo user from localStorage
  useEffect(() => {
    // Check for demo user emails or names
    if (user && (user.email === 'rajesh@dentkart.com' || user.name === 'Dr. Rajesh Koothrappali')) {
      console.log("Cleaning up demo user");
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('alpha_user');
      window.location.reload();
    }
  }, [user]);

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('alpha_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persist Cart & Wishlist
  useEffect(() => {
    localStorage.setItem('alpha_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('alpha_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);



  // Persistence Sync (Only for user data, not migrated data)
  useEffect(() => { localStorage.setItem('alpha_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('alpha_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('alpha_wishlist', JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem('alpha_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('alpha_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);

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
    setIsCartOpen(false);
    setIsMobileMenuOpen(false); // Close menu on any navigation
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

  // Hero Slides CRUD Handlers (Connected to API)
  const handleAddHeroSlide = async (slide: HeroSlide) => {
    try {
      const { heroSlidesAPI } = await import('./utils/api');
      const newSlide = await heroSlidesAPI.create(slide);
      setHeroSlides(prev => [...prev, newSlide]);
    } catch (e) {
      console.error("Failed to create slide", e);
      // Fallback
      setHeroSlides([...heroSlides, { ...slide, id: Date.now() }]);
    }
  };

  const handleUpdateHeroSlide = async (updatedSlide: HeroSlide) => {
    try {
      const { heroSlidesAPI } = await import('./utils/api');
      await heroSlidesAPI.update(updatedSlide.id, updatedSlide);
      setHeroSlides(heroSlides.map(s => s.id === updatedSlide.id ? updatedSlide : s));
    } catch (e) {
      console.error("Failed to update slide", e);
    }
  };

  const handleDeleteHeroSlide = async (id: number) => {
    try {
      const { heroSlidesAPI } = await import('./utils/api');
      await heroSlidesAPI.delete(id);
      setHeroSlides(heroSlides.filter(s => s.id !== id));
    } catch (e) {
      console.error("Failed to delete slide", e);
    }
  };

  const handleReorderHeroSlides = async (reorderedSlides: HeroSlide[]) => {
    setHeroSlides(reorderedSlides); // Optimistic update
    try {
      const { heroSlidesAPI } = await import('./utils/api');
      await heroSlidesAPI.reorder(reorderedSlides);
    } catch (e) {
      console.error("Failed to reorder", e);
    }
  };

  const handleUpdatePromotionalTile = async (updatedTile: PromotionalTile) => {
    try {
      const { promotionalTilesAPI } = await import('./utils/api');
      await promotionalTilesAPI.update(updatedTile.id, updatedTile);
      setPromotionalTiles(prev => prev.map(t => t.id === updatedTile.id ? updatedTile : t));
    } catch (e) {
      console.error("Failed to update tile", e);
    }
  };

  const handleToggleBrandFeatured = async (brandId: number, isFeatured: boolean) => {
    // Optimistic update
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, isFeatured } : b));
    try {
      const { brandsAPI } = await import('./utils/api');
      // Assuming update method handles partials
      await brandsAPI.update(brandId, { isFeatured });
    } catch (e) {
      console.error("Failed to toggle featured brand", e);
    }
  };

  const handleReorderFeaturedBrands = async (reorderedBrands: BrandProfile[]) => {
    // Logic for reordering if needed in future
    console.log("Reorder not implemented yet");
  };

  // Demo User for Local Mode
  // Demo User for Local Mode - Use MOCK_USER from data
  // const DEMO_USER used locally was incomplete

  // SECURE Auth Logic - Uses Backend API
  const handleLogin = async (email?: string, password?: string) => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    try {
      // Call secure backend API
      const { authAPI } = await import('./utils/api');
      const { user } = await authAPI.login(email, password);

      // Set user state from backend response
      setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        avatar: user.avatar || '',
        cart: [],
        wishlist: [],
        orders: [],
        recentlyViewed: [],
        addresses: [],
      });

      // Set admin status based on backend role
      setIsAdmin(user.role === 'admin');
      localStorage.setItem('isAdmin', user.role === 'admin' ? 'true' : 'false');
      setIsLoggedIn(true);

      // Navigate to appropriate dashboard
      if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('dashboard');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    setCart([]);
    setWishlist([]);
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogin = (adminUser?: any) => {
    if (adminUser) {
      setUser(adminUser);
      setIsAdmin(true);
      setIsLoggedIn(true);
      localStorage.setItem('isAdmin', 'true');
    } else {
      setIsAdmin(true);
      setIsLoggedIn(true);
      localStorage.setItem('isAdmin', 'true');
    }
    setCurrentView('admin-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedData });
    }
  };

  // Logic
  const handleProductClick = (product: Product) => {
    console.log("Product Clicked:", product.name, product.id);
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

      return newCart;
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.cartItemId !== cartItemId);

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

  const handlePlaceOrder = async (paymentId: string, transactionId: string, signature?: string) => {
    if (!user) return;

    // 1. Prepare Order Data calling Backend API
    const orderItems = cart.map(item => ({
      productId: item.id, // Assuming cart item has ID
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];

    const orderPayload = {
      items: orderItems,
      total: totalAmount,
      shippingAddress: shippingAddress,
      paymentMethod: 'razorpay',
      paymentId: paymentId,
      transactionId: transactionId, // Razorpay Order ID
      signature: signature
    };

    try {
      setIsDataLoading(true);
      const response = await ordersAPI.create(orderPayload);
      const newOrder = response.order; // Assuming backend returns { order: ... }

      // 2. Update Local State with Server Response
      setOrders(prev => [newOrder, ...prev]);

      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          orders: [newOrder, ...(prevUser.orders || [])]
        };
      });

      // 3. Clear Cart
      setCart([]);



      alert('Order placed successfully! Order ID: ' + newOrder.id);
      setCurrentView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Failed to create order on backend:', error);
      alert('Order creation failed on server. Please contact support if payment was deducted.');
    } finally {
      setIsDataLoading(false);
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





  if ((currentView as ViewState) === 'admin-login') {
    return (
      <Suspense fallback={<Loading fullScreen message="Loading Admin Login..." />}>
        <AdminLogin
          onAdminLogin={handleAdminLogin}
          onNavigateToUserLogin={() => handleNavigate('login')}
          isAdmin={isAdmin}
          user={user}
        />
      </Suspense>
    );
  }

  if ((currentView as ViewState) === 'admin-dashboard') {
    if (!isAdmin) {
      return (
        <Suspense fallback={<Loading fullScreen message="Loading Admin Login..." />}>
          <AdminLogin
            onAdminLogin={handleAdminLogin}
            onNavigateToUserLogin={() => handleNavigate('login')}
            isAdmin={isAdmin}
            user={user}
          />
        </Suspense>
      );
    }

    return (
      <AdminDashboard
        products={products}
        setProducts={setProducts}
        orders={orders}
        setOrders={setOrders}
        reviews={reviews}
        setReviews={setReviews}
        categories={categories}
        setCategories={setCategories}
        brands={brands}
        setBrands={setBrands}
        users={users}
        setUsers={setUsers}
        onLogout={handleLogout}
        onVisitSite={navigateToHome}
        settings={settings}
        setSettings={setSettings}
        heroSlides={heroSlides}
        onAddHeroSlide={handleAddHeroSlide}
        onUpdateHeroSlide={handleUpdateHeroSlide}
        onDeleteHeroSlide={handleDeleteHeroSlide}
        onReorderHeroSlides={handleReorderHeroSlides}
        promotionalTiles={promotionalTiles}
        onUpdatePromotionalTile={handleUpdatePromotionalTile}
        onToggleBrandFeatured={handleToggleBrandFeatured}
        onReorderFeaturedBrands={handleReorderFeaturedBrands}
      />
    );
  }

  // Theme 2 Demo Page
  if (currentView === 'theme2-demo') {
    return <Theme2Demo />;
  }

  // Theme 3 Demo Page
  if (currentView === 'theme3-demo') {
    return <Theme3Demo />;
  }

  console.log("App Render:", { currentView, selectedProductId: selectedProduct?.id, productsCount: products.length });

  // Show loading state while data is being fetched (prevents flash of wrong content on direct URL access)
  if (isDataLoading) {
    return <Loading fullScreen message="Loading Alpha Dentkart..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background-dark flex flex-col">
      <Header
        onNavigate={handleNavigate}
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        cartTotal={cartTotal}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        isLoggedIn={isLoggedIn}
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        categories={categories}
        settings={settings}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        recentlyViewed={recentlyViewed}
        onProductClick={handleProductClick}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onStartShopping={() => navigateToShop()}
        user={user}
        onCheckout={() => {
          setIsCartOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setCurrentView('checkout');
        }}
        onLogin={() => {
          setIsCartOpen(false);
          handleNavigate('login');
        }}
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

      <main className={`container mx-auto px-0 md:px-4 pb-24 md:pb-8 space-y-8 md:space-y-12 flex-1 ${currentView === 'shop' ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>

        {currentView === 'home' && (
          <>
            <div className="space-y-6 md:space-y-8 px-4 md:px-0">
              <Hero
                onShopClick={() => navigateToShop()}
                onProductClick={handleProductClick}
                onCategoryClick={(category) => navigateToShop(category)}
                onBrandClick={(brand) => navigateToShop(undefined, brand)}
                products={products}
                slides={heroSlides}
              />
              <BrandScroll onBrandClick={(brand) => navigateToShop(undefined, brand)} brands={brands} />
            </div>

            {/* Premium Categories Box Mesh - Horizontal Scroll */}
            <section className="px-4 md:px-0">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Shop by Category</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Professional Excellence</p>
                </div>
                <button
                  onClick={() => navigateToShop()}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-accent transition-colors"
                >
                  View All <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>

              <div ref={categoryScrollRef} className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide scroll-smooth snap-x">
                {categories.map(cat => (
                  <a key={cat.id} onClick={() => navigateToShop(cat.name)} className="flex flex-col items-center min-w-[100px] md:min-w-[140px] gap-3 group cursor-pointer snap-start">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-white dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:border-primary/30 group-hover:shadow-premium transition-all duration-500 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <i className={`${cat.icon || 'fas fa-tooth'} text-2xl md:text-4xl group-hover:scale-110 group-hover:text-primary transition-transform duration-500`}></i>
                    </div>
                    <span className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest group-hover:text-primary transition-colors text-center px-1 truncate w-full">
                      {cat.name}
                    </span>
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

          {currentView === 'privacy-policy' && (
            <Suspense fallback={<Loading />}>
              <PrivacyPolicy />
            </Suspense>
          )}

          {currentView === 'terms-of-service' && (
            <Suspense fallback={<Loading />}>
              <TermsOfService />
            </Suspense>
          )}

          {currentView === 'checkout' && user && (
            <div className="bg-gray-50 dark:bg-background-dark min-h-[60vh]">
              <Checkout
                cart={cart}
                user={user}
                onUpdateUser={handleUpdateUser}
                onPlaceOrder={handlePlaceOrder}
                onNavigateBack={() => navigateToShop()}
                razorpayKey={settings.payment?.razorpay?.keyId}
              />
            </div>
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

      {/* Sticky Cart Button - Mobile Only */}
      {!isCartOpen && (
        <StickyCartButton
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
          cartTotal={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
          onOpenCart={() => setIsCartOpen(true)}
          currency={settings.general.currency}
        />
      )}

      {(currentView as string) !== 'admin-dashboard' && <Footer />}
      <CookieConsent />
    </div>
  );
}

export default App;


