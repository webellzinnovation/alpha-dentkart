
import React, { useRef, useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { Toaster, toast } from 'sonner';
import { Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Loading } from './components/Loading';
import OptimizedImageMemo from './components/OptimizedImage';
import { BrandScroll } from './components/BrandScroll';
import { ProductCard } from './components/ProductCard';
import { SkeletonLoader, ProductCardSkeleton } from './components/SkeletonLoader';
const Shop = lazy(() => import('./components/Shop').then(m => ({ default: m.Shop })));
import { Brands } from './components/Brands';
import { Categories } from './components/Categories';
import { Footer } from './components/Footer';
const Wishlist = lazy(() => import('./components/Wishlist').then(m => ({ default: m.Wishlist })));
import { CartSidebar } from './components/CartSidebar';
import { QuickReorder } from './components/QuickReorder';
import { GuestCheckout } from './components/GuestCheckout';
import { ProductModal } from './components/ProductModal';
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./components/Register').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const ForgotPassword = lazy(() => import('./components/ForgotPassword').then(m => ({ default: m.ForgotPassword })));

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
import { PROMOS, HERO_SLIDES, CATEGORIES, BRAND_PROFILES } from './constants';
import { Product, CartItem, User, Order, Category, BrandProfile, HeroSlide, PromotionalTile, HomepageSettings, ChatSession, Coupon } from './types';
import cache, { CACHE_KEYS, CACHE_TTL } from './utils/cache';
// import { adaptDemoData } from './utils/demoDataAdapter';
import { createUniqueSlug, extractIdFromSlug, generateSlug } from './utils/slugify';
// import { MOCK_USER } from './data/mockData';
import { ordersAPI } from './utils/api';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';

/**
 * Transforms API product data into the local Product type
 */
const transformProducts = (products: any[]): Product[] => {
  return products.map((p: any) => ({
    id: p.id,
    name: p.name || 'Unknown Product',
    category: (p.category && typeof p.category === 'object') ? p.category.name : (typeof p.category === 'string' ? p.category : 'General'),
    price: p.price || 0,
    originalPrice: p.originalPrice || p.price,
    rating: p.rating || 0,
    reviews: p.reviews || 0,
    image: p.image || p.images?.[0] || '/placeholder.png',
    badge: p.badge,
    badgeColor: p.badgeColor,
    badgeId: p.badgeId,
    timer: p.timer,
    brand: (p.brand && typeof p.brand === 'object') ? p.brand.name : (typeof p.brand === 'string' ? p.brand : ''),
    description: p.description,
    features: p.features || [],
    specs: p.specs || {},
    images: p.images || [p.image],
    attributes: p.attributes || [],
    variations: p.variations || [],
    shortDescription: p.shortDescription,
    weight: p.weight,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    seoKeywords: p.seoKeywords,
    stock: (p.stock === undefined || p.stock === null) ? 9999 : p.stock,
    // Additional fields from API
    slug: p.slug,
    type: p.type,
    sku: p.sku,
  }));
};

const DEFAULT_PROMOTIONAL_TILES: PromotionalTile[] = [
  {
    id: 1,
    title: "High Speed Airotor Handpiece",
    category: "Clinic Essential",
    price: "FROM ₹7,500",
    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Airotor",
    link: "/shop?brand=NSK",
    order: 1,
    isActive: true,
    bgColorClass: "bg-cyan-50 dark:bg-gray-800",
    tagColorClass: "text-cyan-600"
  },
  {
    id: 2,
    title: "Composite Restoration Kit",
    category: "Bundle Deal",
    price: "FROM ₹16,900",
    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Composite+Kit",
    link: "/shop?category=Restorative",
    order: 2,
    isActive: true,
    bgColorClass: "bg-teal-50 dark:bg-gray-800",
    tagColorClass: "text-teal-600"
  },
  {
    id: 3,
    title: "Digital Apex Locator V5",
    category: "New Arrival",
    price: "FROM ₹12,500",
    image: "https://placehold.co/300x300/transparent/DD3B5F?text=Apex+Locator",
    link: "/shop?category=Endodontics",
    order: 3,
    isActive: true,
    bgColorClass: "bg-sky-50 dark:bg-gray-800",
    tagColorClass: "text-sky-600"
  }
];

const getPromoStyles = (index: number) => {
  const styles = [
    { bg: "bg-cyan-50 dark:bg-gray-800", tag: "text-cyan-600" },
    { bg: "bg-teal-50 dark:bg-gray-800", tag: "text-teal-600" },
    { bg: "bg-sky-50 dark:bg-gray-800", tag: "text-sky-600" }
  ];
  return styles[index % styles.length];
};

type ViewState = 'home' | 'shop' | 'brands' | 'categories' | 'wishlist' | 'product-detail' | 'login' | 'register' | 'forgot-password' | 'dashboard' | 'admin-dashboard' | 'admin-login' | 'theme2-demo' | 'theme3-demo' | 'checkout' | 'privacy-policy' | 'terms-of-service';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize view from URL
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const path = location.pathname.replace(/\/+$/, '').substring(1); // remove leading and trailing slashes
    if (path === '' || path === 'home') return 'home';
    if (path === 'shop' || path.startsWith('category/') || path.startsWith('brand/')) return 'shop';
    if (path === 'brands') return 'brands';
    if (path === 'categories') return 'categories';
    if (path === 'wishlist') return 'wishlist';
    if (path === 'login') return 'login';
    if (path === 'register') return 'register';
    if (path === 'forgot-password') return 'forgot-password';
    if (path === 'dashboard') return 'dashboard';
    if (path === 'admin') return 'admin-dashboard';
    if (path === 'admin-login') return 'admin-login';
    if (path === 'checkout') return 'checkout';
    if (path.startsWith('product/')) return 'product-detail';
    if (path === 'privacy-policy') return 'privacy-policy';
    if (path === 'terms-of-service') return 'terms-of-service';
    return 'home';
  });

  // Auth State (Moved up to fix hoisting)
  const {
    isLoggedIn,
    user, setUser,
    isAdmin, setIsAdmin
  } = useAuth();

  // App Data State (Moved up to fix ReferenceError in useCart/useWishlist)
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProductCount, setTotalProductCount] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('alpha_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing alpha_orders:', e);
      return [];
    }
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [promotionalTiles, setPromotionalTiles] = useState<PromotionalTile[]>(DEFAULT_PROMOTIONAL_TILES);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const {
    cart, setCart,
    isCartOpen, setIsCartOpen,
    addToCart, removeFromCart,
    updateCartQuantity, clearCart
  } = useCart(user, isAdmin, products);

  const {
    wishlist, setWishlist,
    toggleWishlist, isInWishlist
  } = useWishlist(user, isAdmin, products);


  const [shopCategory, setShopCategory] = useState<string | null>(null);
  const [shopBrand, setShopBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'top' | 'featured'>('new');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [showSkeletons, setShowSkeletons] = useState(false);


  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // STALE-WHILE-REVALIDATE: Load data with caching for instant display
  useEffect(() => {
    const loadAppData = async () => {
      console.log("🚀 Starting app data load with stale-while-revalidate...");
      
      // STEP 1: Load from cache FIRST (instant - no waiting)
      const cachedProducts = cache.get<Product[]>(CACHE_KEYS.PRODUCTS);
      const cachedCategories = cache.get<any[]>(CACHE_KEYS.CATEGORIES);
      const cachedBrands = cache.get<any[]>(CACHE_KEYS.BRANDS);
      const cachedHeroSlides = cache.get<HeroSlide[]>(CACHE_KEYS.HERO_SLIDES);
      const cachedSettings = cache.get<any>(CACHE_KEYS.SETTINGS);

      // If we have cached data, show it immediately
      if (cachedProducts) {
        console.log(`📦 Cache hit: ${cachedProducts.length} products loaded instantly`);
        setProducts(cachedProducts);
      }
      if (cachedCategories) {
        setCategories(cachedCategories);
      }
      if (cachedBrands) {
        setBrands(cachedBrands);
      }
      if (cachedHeroSlides) {
        setHeroSlides(cachedHeroSlides);
      }
      if (cachedSettings) {
        setSettings((prev: any) => ({ ...prev, ...cachedSettings }));
      }

      // Show loading state only if we have NO cached data
      const hasNoData = !cachedProducts && !cachedCategories && !cachedBrands;
      if (hasNoData) {
        setIsDataLoading(true);
      }

      // STEP 2: Fetch FRESH data from API in background
      setDataLoadError(null);
      setLoadProgress(10);
      
      // Fetch CSRF token first (required for POST requests)
      try {
        await fetch('/api/v1/csrf-token', { credentials: 'include' });
      } catch (err) {
        console.warn('CSRF token fetch warning (non-critical):', err);
      }
      
      try {
        const api = await import('./utils/api');
        const { productsAPI, categoriesAPI, brandsAPI, heroSlidesAPI, promotionalTilesAPI, settingsAPI, authAPI } = api;

        setLoadProgress(20);

        const savedIsAdmin = localStorage.getItem('isAdmin') === 'true';
        // Always start with a fast 200-product fetch — admin full catalog loads progressively in background
        const fetchLimit = 200;
        
        // PHASE 1: Fast UI data — unblocks loading screen immediately
        console.log(`📡 Phase 1: Fetching fast UI data (categories, brands, slides, auth)...`);
        
        const fastPromises = [
          categoriesAPI.getAll(),
          brandsAPI.getAll(),
          heroSlidesAPI.getAll(),
          promotionalTilesAPI.getAll(),
          settingsAPI.get(),
          authAPI.me()
        ];

        const fastResults = await Promise.allSettled(fastPromises);
        
        // Map fast results to named positions
        const categoriesResponse  = fastResults[0];
        const brandsResponse      = fastResults[1];
        const slidesResponse      = fastResults[2];
        const tilesResponse       = fastResults[3];
        const settingsResponse    = fastResults[4];
        const authResponse        = fastResults[5];

        setLoadProgress(60);

        // PHASE 2: Products — fetch in background, don't block page render
        console.log(`📡 Phase 2: Fetching products in background (limit: ${fetchLimit})...`);
        const productsPromise = productsAPI.getAll({ limit: fetchLimit });

        // Pre-emptively fetch admin data if likely admin (users fetched separately via fetchUsersPage)
        let adminDataIndices: Record<string, number> = {};
        const adminFetchPromises: Promise<any>[] = [];
        if (savedIsAdmin) {
          const { reviewsAPI, chatSessionsAPI } = await import('./utils/api');
          adminDataIndices.reviews = adminFetchPromises.length;
          adminFetchPromises.push(reviewsAPI.getAllAdmin());
          adminDataIndices.chatSessions = adminFetchPromises.length;
          adminFetchPromises.push(chatSessionsAPI.getAll());
        }

        setLoadProgress(70);

        // Process other results (from fast phase)
        const processResult = (result: PromiseSettledResult<any>, key: string): any[] => {
          if (result.status === 'fulfilled' && result.value) {
            // Check for nested structure
            if (result.value[key]) return result.value[key];
            if (result.value.data && result.value.data[key]) return result.value.data[key];
            if (Array.isArray(result.value)) return result.value;
            return [];
          }
          if (result.status === 'rejected') {
            console.error(`❌ API call failed:`, result.reason);
          }
          return [];
        };

        const freshCategories = processResult(categoriesResponse, 'categories');
        if (freshCategories.length > 0) {
          const categoriesWithMeta = freshCategories.map((cat: any) => ({
            ...cat,
            slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'),
            iconClass: cat.iconClass || 'fas fa-teeth'
          }));
          setCategories(categoriesWithMeta);
          cache.set(CACHE_KEYS.CATEGORIES, categoriesWithMeta, CACHE_TTL.CATEGORIES);
        }

        const freshBrands = processResult(brandsResponse, 'brands');
        if (freshBrands.length > 0) {
          const brandsWithMeta = freshBrands.map((brand: any) => ({
            ...brand,
            logo: brand.logo || `https://placehold.co/200x200?text=${brand.name}`,
            productCount: brand.productCount || 0
          }));
          setBrands(brandsWithMeta);
          cache.set(CACHE_KEYS.BRANDS, brandsWithMeta, CACHE_TTL.BRANDS);
        }

        const freshSlides = processResult(slidesResponse, 'slides');
        if (freshSlides.length > 0) {
          setHeroSlides(freshSlides);
          cache.set(CACHE_KEYS.HERO_SLIDES, freshSlides, CACHE_TTL.HERO_SLIDES);
        }

        const freshTiles = processResult(tilesResponse, 'tiles');
        if (freshTiles.length > 0) {
          setPromotionalTiles(freshTiles);
          cache.set(CACHE_KEYS.PROMO_TILES, freshTiles, CACHE_TTL.PROMO_TILES);
        }

        // Settings
        if (settingsResponse.status === 'fulfilled' && settingsResponse.value) {
          const innerSettings = settingsResponse.value.settings ?? settingsResponse.value;
          if (innerSettings && typeof innerSettings === 'object') {
            setSettings((prev: any) => ({
              ...prev,
              ...innerSettings,
              whatsapp: innerSettings.whatsapp || prev.whatsapp
            }));
            cache.set(CACHE_KEYS.SETTINGS, innerSettings, CACHE_TTL.SETTINGS);
          }
        }

        // Auth
        if (authResponse.status === 'fulfilled' && authResponse.value?.user) {
          const meUser = authResponse.value.user;
          setUser(meUser);
          setIsAdmin(meUser.role === 'admin');
          localStorage.setItem('isAdmin', meUser.role === 'admin' ? 'true' : 'false');
          console.log("👤 User session verified:", meUser.email, "Role:", meUser.role);
        } else {
          // If auth failed but we thought we were admin/logged in, reset state to stop 401 loops
          if (savedIsAdmin || isLoggedIn) {
            console.warn("⚠️ Authentication session invalid or expired. Resetting local auth state.");
            setIsAdmin(false);
            setUser(null);
            localStorage.setItem('isAdmin', 'false');
            localStorage.removeItem('alpha_user');
          }
        }

        // Admin data is now handled in the background phase below

        // Unblock the UI — page is ready
        setLoadProgress(90);
        setIsDataLoading(false);
        console.log("✅ Fast data loaded — page is now interactive");

        // Resolve products in background (page already visible)
        const productsResult = await productsPromise.then(v => ({ status: 'fulfilled' as const, value: v })).catch(e => ({ status: 'rejected' as const, reason: e }));
        let productsResponse: any = null;
        if (productsResult.status === 'fulfilled') {
          productsResponse = productsResult.value;
        } else {
          console.error("❌ Products API call failed:", productsResult.reason);
        }

        let freshProducts: any[] = [];
        if (productsResponse?.products) {
          freshProducts = productsResponse.products;
          if (productsResponse.pagination?.total) {
            setTotalProductCount(productsResponse.pagination.total);
          }
        } else if (Array.isArray(productsResponse)) {
          freshProducts = productsResponse;
        }

        const bgTransformedProducts = transformProducts(freshProducts);
        if (bgTransformedProducts.length > 0) {
          setProducts(bgTransformedProducts);
          cache.set(CACHE_KEYS.PRODUCTS, bgTransformedProducts, CACHE_TTL.PRODUCTS);
          console.log(`✅ Background: loaded ${bgTransformedProducts.length} products`);
        }

        // Resolve admin data in background
        if (savedIsAdmin && adminFetchPromises.length > 0) {
          const adminResults = await Promise.allSettled(adminFetchPromises);
          if (adminDataIndices.reviews !== undefined) {
            const reviewsResult = adminResults[adminDataIndices.reviews];
            if (reviewsResult.status === 'fulfilled' && reviewsResult.value) {
              const reviewsData = reviewsResult.value.reviews || reviewsResult.value;
              if (Array.isArray(reviewsData)) {
                const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').trim() : '';
                setReviews(reviewsData.map((r: any) => ({
                  id: r.id,
                  product: r.productId || r.productName || 'Unknown Product',
                  user: r.reviewer || r.userId || 'Anonymous',
                  rating: r.rating || 0,
                  comment: stripHtml(r.content || r.title || ''),
                  date: r.createdAt?._seconds
                    ? new Date(r.createdAt._seconds * 1000).toLocaleDateString()
                    : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Unknown'),
                  isApproved: r.isApproved
                })));
              }
            }
          }
          if (adminDataIndices.chatSessions !== undefined) {
            const chatRes = adminResults[adminDataIndices.chatSessions];
            if (chatRes.status === 'fulfilled') setChatSessions(chatRes.value);
          }
        }

        setLoadProgress(100);
        console.log("✅ All data fully loaded");

      } catch (err: any) {
        console.error("❌ Failed to fetch fresh data:", err);
        console.error("Error type:", err?.constructor?.name);
        console.error("Error message:", err?.message);
        console.error("Error code:", err?.code);
        console.error("Response data:", err?.response?.data);
        
        // If we have cached data, keep showing it (stale is better than nothing)
        if (cachedProducts || cachedCategories || cachedBrands) {
          console.log("📦 Using stale cached data (fetch failed)");
          setIsDataLoading(false);
          setDataLoadError("Using cached data. Some information may be outdated.");
        } else {
          // No cache and fetch failed - show error
          const errorMsg = err?.response?.data?.message || err?.message || "Failed to connect to server";
          setDataLoadError(errorMsg);
        }
      }
    };

    loadAppData();
  }, []);

  // Retry function for data loading
  const retryDataLoad = () => {
    // Clear cache and reload
    cache.clear();
    setIsDataLoading(true);
    setDataLoadError(null);
    setLoadProgress(0);
    window.location.reload();
  };

  // Manual refresh function (for pull-to-refresh or button)
  const refreshData = async () => {
    setIsRefreshing(true);
    cache.clear(); // Clear cache to force fresh fetch
    
    try {
      const api = await import('./utils/api');
      const { productsAPI, categoriesAPI, brandsAPI, heroSlidesAPI, settingsAPI } = api;

      // Fetch products first
      const isAdminUser = localStorage.getItem('isAdmin') === 'true';
      const fetchLimit = isAdminUser ? 5000 : 200;
      const productsResponse = await productsAPI.getAll({ limit: fetchLimit });
      
      // Then others
      const [categoriesResponse, brandsResponse, slidesResponse, settingsResponse] = await Promise.allSettled([
        categoriesAPI.getAll(),
        brandsAPI.getAll(),
        heroSlidesAPI.getAll(),
        settingsAPI.get()
      ]);

      // Process products
      let freshProducts: any[] = [];
      if (productsResponse && productsResponse.products) {
        freshProducts = productsResponse.products;
      } else if (productsResponse && Array.isArray(productsResponse)) {
        freshProducts = productsResponse;
      }

      // Transform products to ensure they match Product type
      const transformedProducts = freshProducts.map((p: any) => ({
        id: p.id,
        name: p.name || 'Unknown Product',
        category: (p.category && typeof p.category === 'object') ? p.category.name : (typeof p.category === 'string' ? p.category : 'General'),
        price: p.price || 0,
        originalPrice: p.originalPrice || p.price,
        rating: p.rating || 0,
        reviews: p.reviews || 0,
        image: p.image || p.images?.[0] || '/placeholder.png',
        badge: p.badge,
        badgeColor: p.badgeColor,
        badgeId: p.badgeId,
        timer: p.timer,
        brand: (p.brand && typeof p.brand === 'object') ? p.brand.name : (typeof p.brand === 'string' ? p.brand : ''),
        description: p.description,
        features: p.features || [],
        specs: p.specs || {},
        images: p.images || [p.image],
        attributes: p.attributes || [],
        variations: p.variations || [],
        shortDescription: p.shortDescription,
        weight: p.weight,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        seoKeywords: p.seoKeywords,
        stock: p.stock ?? 10,
        slug: p.slug,
        type: p.type,
        sku: p.sku,
      }));

      if (transformedProducts.length > 0) {
        setProducts(transformedProducts);
        cache.set(CACHE_KEYS.PRODUCTS, transformedProducts, CACHE_TTL.PRODUCTS);
        console.log(`🔄 Refreshed ${transformedProducts.length} products`);
      }

      const processResult = (result: PromiseSettledResult<any>, key: string): any[] => {
        if (result.status === 'fulfilled' && result.value) {
          return result.value[key] || result.value.data || [];
        }
        return [];
      };

      const freshCategories = processResult(categoriesResponse, 'categories');
      if (freshCategories.length > 0) {
        const categoriesWithMeta = freshCategories.map((cat: any) => ({
          ...cat,
          slug: cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-'),
          iconClass: cat.iconClass || 'fas fa-teeth'
        }));
        setCategories(categoriesWithMeta);
        cache.set(CACHE_KEYS.CATEGORIES, categoriesWithMeta, CACHE_TTL.CATEGORIES);
      }

      const freshBrands = processResult(brandsResponse, 'brands');
      if (freshBrands.length > 0) {
        const brandsWithMeta = freshBrands.map((brand: any) => ({
          ...brand,
          logo: brand.logo || `https://placehold.co/200x200?text=${brand.name}`,
          productCount: brand.productCount || 0
        }));
        setBrands(brandsWithMeta);
        cache.set(CACHE_KEYS.BRANDS, brandsWithMeta, CACHE_TTL.BRANDS);
      }

      const freshSlides = processResult(slidesResponse, 'slides');
      if (freshSlides.length > 0) {
        setHeroSlides(freshSlides);
        cache.set(CACHE_KEYS.HERO_SLIDES, freshSlides, CACHE_TTL.HERO_SLIDES);
      }

      if (settingsResponse.status === 'fulfilled' && settingsResponse.value) {
        const innerSettings = settingsResponse.value.settings ?? settingsResponse.value;
        if (innerSettings && typeof innerSettings === 'object') {
          setSettings((prev: any) => ({ ...prev, ...innerSettings }));
          cache.set(CACHE_KEYS.SETTINGS, innerSettings, CACHE_TTL.SETTINGS);
        }
      }

      console.log("✅ Data refreshed successfully");
    } catch (err) {
      console.error("❌ Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isInitialMount = useRef(true);

  // Sync URL with state for all pages (Listen to location.pathname changes)
  useEffect(() => {
    // Wait for data to load before syncing URL
    if (products.length === 0) return;

    const path = location.pathname;

    // Product detail: /product/colgate-periogard-toothbrush-38243
    const productMatch = path.match(/^\/product\/(.+)$/);
    if (productMatch) {
      const slug = productMatch[1];
      const productId = extractIdFromSlug(slug);
      if (productId) {
        // First try to find in already loaded products
        const product = products.find(p => p.id === Number(productId));
        if (product) {
          setSelectedProduct(product);
          setCurrentView('product-detail');
          return;
        } else if (products.length > 0) {
          // Product not in loaded array - fetch it on-demand from API
          (async () => {
            try {
              const { productsAPI } = await import('./utils/api');
              const response = await productsAPI.getById(Number(productId));
              if (response.product) {
                const p = response.product;
                const transformedProduct = {
                  id: Number(p.id),
                  name: p.name || 'Unknown Product',
                  category: (p.category && typeof p.category === 'object') ? p.category.name : (typeof p.category === 'string' ? p.category : 'General'),
                  price: p.price || 0,
                  originalPrice: p.originalPrice || p.price,
                  rating: p.rating || 0,
                  reviews: p.reviews || 0,
                  image: p.image || p.images?.[0] || '/placeholder.png',
                  badge: p.badge,
                  badgeColor: p.badgeColor,
                  badgeId: p.badgeId,
                  timer: p.timer,
                  brand: (p.brand && typeof p.brand === 'object') ? p.brand.name : (typeof p.brand === 'string' ? p.brand : ''),
                  description: p.description,
                  features: p.features || [],
                  specs: p.specs || {},
                  images: p.images || [p.image],
                  attributes: p.attributes || [],
                  variations: p.variations || [],
                  shortDescription: p.shortDescription,
                  weight: p.weight,
                  seoTitle: p.seoTitle,
                  seoDescription: p.seoDescription,
                  seoKeywords: p.seoKeywords,
                  stock: p.stock ?? 10,
                  slug: p.slug,
                  type: p.type,
                  sku: p.sku,
                };
                setSelectedProduct(transformedProduct);
                setCurrentView('product-detail');
              } else {
                navigate('/shop');
              }
            } catch (err) {
              console.error('Failed to fetch product detail:', err);
              navigate('/shop');
            }
          })();
          return;
        }
      }
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
    } else if (path === '/register') {
      setCurrentView('register');
    } else if (path === '/dashboard') {
      setCurrentView('dashboard');
    } else if (path === '/admin') {
      setCurrentView('admin-dashboard');
    } else if (path === '/admin-login') {
      setCurrentView('admin-login');
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
  }, [location.pathname, products, brands, categories]);

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
    } else if (currentView === 'register') {
      newPath = '/register';
    } else if (currentView === 'dashboard') {
      newPath = '/dashboard';
    } else if (currentView === 'admin-dashboard') {
      newPath = '/admin';
    } else if (currentView === 'admin-login') {
      newPath = '/admin-login';
    } else if (currentView === 'home') {
      newPath = '/';
    } else if (currentView === 'checkout') {
      newPath = '/checkout';
    } else if (currentView === 'privacy-policy') {
      newPath = '/privacy-policy';
    } else if (currentView === 'terms-of-service') {
      newPath = '/terms-of-service';
    }

    if (location.pathname !== newPath) {
      navigate(newPath);
    }
  }, [currentView, selectedProduct, shopBrand, shopCategory, brands, categories]);

  // Global View Scroll to Top reset
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    if (document.body) {
      document.body.scrollTo(0, 0);
    }
    
    const scrollTimeout = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
    }, 50);

    return () => clearTimeout(scrollTimeout);
  }, [currentView, selectedProduct, shopCategory, shopBrand, location.pathname]);

  // Settings State (Lifted from AdminDashboard)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('alpha_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.payment && parsed.payment.cod && parsed.payment.cod.minAmount === undefined) {
          parsed.payment.cod.minAmount = 0;
        }
        if (parsed.shipping && parsed.shipping.stateRules === undefined) {
          parsed.shipping.stateRules = [];
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing alpha_settings:', e);
    }
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
        cod: { enabled: true, minAmount: 0 }
      },
      shipping: {
        standardRate: 150,
        freeShippingThreshold: 5000,
        enableInternational: false,
        stateRules: []
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
      // NEW: Dynamic Homepage Sections
      featuredCategorySections: ['Restorative', 'Endodontics', 'Equipment'],
      showcaseCategories: [],
      showcaseBrands: [],
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


  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);



  // Persistence Sync (Only for user data, not migrated data)
  useEffect(() => { localStorage.setItem('alpha_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('alpha_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('alpha_recently_viewed', JSON.stringify(recentlyViewed)); }, [recentlyViewed]);

  // Sync orders to user (for customer dashboard)
  useEffect(() => {
    if (user && orders.length > 0) {
      const userOrders = orders.filter(o => o.userId === user.email || o.email === user.email || o.customerName === user.name);
      if (JSON.stringify(userOrders) !== JSON.stringify(user.orders)) {
        setUser({ ...user, orders: userOrders });
      }
    }
  }, [orders, user]);

  const refreshOrders = async () => {
    if (user && !isAdmin) {
      try {
        const response = await ordersAPI.getMyOrders();
        if (response.orders) {
          setOrders(prev => {
            const otherOrders = prev.filter(o => o.userId !== user.id && o.userId !== user.email);
            return [...response.orders, ...otherOrders];
          });
          setUser({ ...user, orders: response.orders });
        }
      } catch (error: any) {
        if (error.response?.status !== 401) {
          console.error('Failed to refresh orders:', error);
        }
      }
    }
  };

  // Fetch user orders on login
  useEffect(() => {
    if (user && !isAdmin) {
      refreshOrders();
    }
  }, [user, isAdmin]);



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
    else if (page === 'register') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentView('register');
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
      setHeroSlides(prev => prev.map(s => s.id === updatedSlide.id ? updatedSlide : s));
    } catch (e) {
      console.error("Failed to update slide", e);
    }
  };

  const handleDeleteHeroSlide = async (id: number) => {
    try {
      const { heroSlidesAPI } = await import('./utils/api');
      await heroSlidesAPI.delete(id);
      setHeroSlides(prev => prev.filter(s => s.id !== id));
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

  // Featured Brands derived logic
  const displayBrands = useMemo(() => {
    const featured = (brands || []).filter(b => b.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
    return featured.length > 0 ? featured : brands;
  }, [brands]);

  const featuredBrandsOnly = useMemo(() => {
    return (brands || []).filter(b => b.isFeatured).sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
  }, [brands]);

  // Active Promo Banners derived logic
  const displayPromos = useMemo(() => {
    const active = (promotionalTiles || []).filter(t => t.isActive);
    return active.length > 0 ? active : DEFAULT_PROMOTIONAL_TILES;
  }, [promotionalTiles]);

  // Logic for computing showcase categories for the storefront
  const { displayCategories, shouldAnimateCategories } = useMemo(() => {
    const display = (settings?.showcaseCategories && settings.showcaseCategories.length > 0)
      ? settings.showcaseCategories.map((name: string) => categories.find(c => c.name === name)).filter(Boolean) as Category[]
      : categories.slice(0, 8);
    return {
      displayCategories: display,
      shouldAnimateCategories: display.length > 6
    };
  }, [settings?.showcaseCategories, categories]);

  const handleToggleBrandFeatured = async (brandId: number, isFeatured: boolean) => {
    // Optimistic update
    setBrands(prev => prev.map(b => b.id === brandId ? { ...b, isFeatured } : b));
    try {
      const { brandsAPI } = await import('./utils/api');
      await brandsAPI.updateFeatured(brandId, { isFeatured });
    } catch (e) {
      console.error("Failed to toggle featured brand", e);
    }
  };

  const handleReorderFeaturedBrands = async (reorderedBrands: BrandProfile[]) => {
    // Optimistic update
    setBrands(reorderedBrands);
    try {
      const { brandsAPI } = await import('./utils/api');
      const payload = reorderedBrands
        .filter(b => b.isFeatured)
        .map(b => ({ id: b.id, featuredOrder: b.featuredOrder }));
      await brandsAPI.reorder(payload);
    } catch (e) {
      console.error("Failed to reorder featured brands", e);
    }
  };

  const handleSaveHomepageSettings = async (newSettings: Partial<HomepageSettings>) => {
    const { settingsAPI } = await import('./utils/api');
    await settingsAPI.update(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Demo User for Local Mode
  // Demo User for Local Mode - Use MOCK_USER from data
  // const DEMO_USER used locally was incomplete

  // SECURE Auth Logic - Uses Backend API
  const handleLogin = async (email?: string, password?: string) => {
    if (!email || !password) {
      toast.error('Please enter email and password');
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
        addresses: user.addresses || [],
        isVerified: user.isVerified ?? false,
        role: user.role,
        cart: [],
        wishlist: [],
        orders: [],
        recentlyViewed: [],
      });

      // Set admin status based on backend role
      setIsAdmin(user.role === 'admin');
      localStorage.setItem('isAdmin', user.role === 'admin' ? 'true' : 'false');

      // Navigate to appropriate dashboard
      if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('dashboard');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegister = async (data: any) => {
    try {
      const { authAPI } = await import('./utils/api');
      const response = await authAPI.register(data);
      
      // Auto login after registration
      if (response.user) {
        setUser({
          ...response.user,
          phone: response.user.phone || '',
          avatar: response.user.avatar || '',
          addresses: [],
          isVerified: false,
          cart: [],
          wishlist: [],
          orders: [],
          recentlyViewed: [],
        });
        setCurrentView('dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Just show success and navigate to login
        toast.success('Registration successful! Please login.');
        setCurrentView('login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      const { authAPI } = await import('./utils/api');
      await authAPI.logout();
    } catch (e) {
      console.error("Logout API failed:", e);
    }
    
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('alpha_user');
    setCart([]);
    setWishlist([]);
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdminLogin = (adminUser?: any) => {
    if (adminUser) {
      setUser(adminUser);
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
    } else {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
    }
    setCurrentView('admin-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (user) {
      // Optimistic update
      const previousUser = { ...user };
      setUser({ ...user, ...updatedData });
      
      try {
        const { authAPI } = await import('./utils/api');
        await authAPI.updateProfile(updatedData);
        console.log("✅ User profile persisted to server");
      } catch (error) {
        console.error("❌ Failed to persist user profile:", error);
        // Rollback on failure
        setUser(previousUser);
      }
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
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };





  const handlePlaceOrder = async (paymentId: string, transactionId: string, signature?: string, paymentMethod: string = 'razorpay') => {
    if (!user) return;

    if (!user.addresses || user.addresses.length === 0) {
      toast.error('Please add a shipping address before placing an order.');
      return;
    }

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
      shippingAddress: {
        name: shippingAddress.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        phone: shippingAddress.phone,
      },
      paymentMethod: paymentMethod,
      paymentId: paymentId,
      transactionId: transactionId,
      signature: signature
    };

    try {
      setIsDataLoading(true);
      console.log('Sending order payload:', JSON.stringify(orderPayload, null, 2));
      const response = await ordersAPI.create(orderPayload);
      console.log('Order response:', response);
      const newOrder = response.order;

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



      toast.success('Order placed successfully! Order ID: ' + newOrder.id);
      setCurrentView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error: any) {
      console.error('Failed to create order on backend:', error);
      const serverError = error.response?.data?.error || error.response?.data?.message || 'Unknown server error';
      console.error('Server error details:', serverError);
      toast.error(`Order creation failed: ${serverError}`);
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

  // Load admin data (orders, users, reviews) when admin dashboard is accessed
  useEffect(() => {
    if (isAdmin || currentView === 'admin-dashboard') {
      const loadAdminData = async () => {
        setIsAdminLoading(true);
        try {
          console.log("📡 Admin detected, starting background data fetch...");
          
          // Helper to strip HTML tags
          const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').trim() : '';

          // 1. Fetch Users, Orders, Reviews and Chat Sessions in parallel (The primary admin data)
          const { reviewsAPI, chatSessionsAPI, productsAPI, usersAPI: _usersAPI } = await import('./utils/api');
          
          const primaryAdminPromises = [
            ordersAPI.getAllAdmin({ limit: 500 }).catch(err => { console.warn('Orders API failed:', err); return null; }),
            reviewsAPI.getAllAdmin().catch(err => { console.warn('Reviews API failed:', err); return null; }),
            chatSessionsAPI.getAll().catch(err => { console.warn('Chat Sessions API failed:', err); return null; }),
            fetchUsersPage(1).catch(err => { console.warn('Initial users fetch failed:', err); return null; })
          ];

          const [ordersRes, reviewsRes, chatSessionsRes, usersRes] = await Promise.all(primaryAdminPromises);

          // Update state as soon as we have data
          if (ordersRes && ordersRes.orders) {
            setOrders(ordersRes.orders);
            localStorage.setItem('alpha_orders', JSON.stringify(ordersRes.orders));
          }

          if (reviewsRes && reviewsRes.reviews) {
            const mappedReviews = reviewsRes.reviews.map((r: any) => ({
              id: r.id,
              product: r.productId || r.productName || 'Unknown Product',
              user: r.reviewer || r.userId || 'Anonymous',
              rating: r.rating || 0,
              comment: stripHtml(r.content || r.title || ''),
              date: r.createdAt?._seconds 
                ? new Date(r.createdAt._seconds * 1000).toLocaleDateString()
                : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Unknown'),
              isApproved: r.isApproved
            }));
            setReviews(mappedReviews);
          }

          if (chatSessionsRes) {
            setChatSessions(chatSessionsRes);
          }

          // 2. Fetch full catalog in background if needed (This is heavy)
          const needsProducts = products.length === 0 || (totalProductCount > 0 && products.length < totalProductCount) || (products.length < 200 && totalProductCount === 0);
          
          if (needsProducts) {
            console.log(`📡 Background sync: catalog incomplete (${products.length}/${totalProductCount})`);
            
            const batchSize = 100; // Smaller batches are more stable for WordPress/API
            const endPage = Math.ceil((totalProductCount || 3000) / batchSize);
            
            // Limit concurrent batches to avoid overloading
            const processBatches = async () => {
              const allBatches = [];
              for (let p = 1; p <= endPage; p++) {
                allBatches.push(p);
              }
              
              // Process in chunks of 5 parallel requests
              const chunkSize = 5;
              for (let i = 0; i < allBatches.length; i += chunkSize) {
                const chunk = allBatches.slice(i, i + chunkSize);
                const results = await Promise.all(
                  chunk.map(page => productsAPI.getAll({ page, limit: batchSize }))
                );
                
                let chunkProducts: any[] = [];
                results.forEach(res => {
                  if (res && res.products) chunkProducts = [...chunkProducts, ...res.products];
                  else if (Array.isArray(res)) chunkProducts = [...chunkProducts, ...res];
                });
                
                if (chunkProducts.length > 0) {
                  const transformed = transformProducts(chunkProducts);
                  setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = transformed.filter(p => p.id && !existingIds.has(p.id));
                    if (uniqueNew.length === 0) return prev;
                    const updated = [...prev, ...uniqueNew];
                    cache.set(CACHE_KEYS.PRODUCTS, updated, CACHE_TTL.PRODUCTS);
                    return updated;
                  });
                }
              }
              console.log("✅ Background catalog sync complete");
            };
            
            processBatches().catch(err => console.error('Catalog sync error:', err));
          }

        } catch (error) {
          console.error('Failed to load general admin data:', error);
        } finally {
          setIsAdminLoading(false);
        }
      };
      loadAdminData();
    }
  }, [isAdmin, currentView]);

  // Users pagination state
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageToken, setUsersPageToken] = useState<string | null>(null);
  const [isLoadingUsersPage, setIsLoadingUsersPage] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [totalUsersPages, setTotalUsersPages] = useState(0);
  const [usersPageTokens, setUsersPageTokens] = useState<Map<number, string>>(new Map());
  const usersPerPage = 100;
  
  // Fetch a specific page of users (with sequential fetching for cursor-based pagination)
  const fetchUsersPage = async (page: number, pageTokenFromProps?: string) => {
    setIsLoadingUsersPage(true);
    try {
      // If going to a page we don't have a token for, we need to fetch sequentially
      const currentPage = usersPage;
      let targetPage = page;
      
      // Check if we have the token for this page
      let pageToken = pageTokenFromProps || usersPageTokens.get(targetPage);
      
      // If no token and not on page 1, we need to fetch sequentially from current position
      if (!pageToken && targetPage > 1 && targetPage > currentPage) {
        console.log(`🔄 Need to fetch pages sequentially from ${currentPage + 1} to ${targetPage}`);
        let nextToken = usersPageToken || usersPageTokens.get(currentPage + 1);
        let fetchPage = currentPage + 1;
        
        // Fetch pages sequentially until we reach target
        while (fetchPage <= targetPage && nextToken) {
          const cacheBuster = Date.now();
          const isLastFetch = fetchPage === targetPage;
          
          const params: any = {
            limit: usersPerPage,
            pageToken: nextToken,
            _cb: cacheBuster
          };
          
          if (isLastFetch) {
            params.getTotal = true;
          }
          
          console.log(`📡 Sequential fetch via usersAPI: page ${fetchPage}`);
          
          const { usersAPI } = await import('./utils/api');
          const data = await usersAPI.getAll(params);
          
          if (isLastFetch) {
            // This is our target page
            if (data.users && data.users.length > 0) {
              setUsers(data.users);
            }
            
            // Update total count
            if (data.total && data.total > 0) {
              setTotalUsersCount(data.total);
              const pages = Math.ceil(data.total / usersPerPage);
              setTotalUsersPages(pages);
              console.log(`📊 Total users: ${data.total}, Total pages: ${pages}`);
            }
            
            // Store next page token
            if (data.nextPageToken) {
              setUsersPageTokens(prev => {
                const newMap = new Map(prev);
                newMap.set(targetPage + 1, data.nextPageToken);
                return newMap;
              });
              setUsersPageToken(data.nextPageToken);
            } else {
              setUsersPageToken(null);
            }
            
            setUsersPage(targetPage);
            return data;
          }
          
          // Store token for next page
          if (data.nextPageToken) {
            setUsersPageTokens(prev => {
              const newMap = new Map(prev);
              newMap.set(fetchPage + 1, data.nextPageToken);
              return newMap;
            });
            nextToken = data.nextPageToken;
          } else {
            // No more pages
            console.log('⚠️ No more pages available');
            break;
          }
          fetchPage++;
        }
        setIsLoadingUsersPage(false);
        return;
      }
      
      const cacheBuster = Date.now();
      const params: any = { 
        limit: usersPerPage, 
        _cb: cacheBuster 
      };
      
      if (targetPage === 1 && !pageToken) {
        params.getTotal = true;
      }
      
      if (pageToken) {
        params.pageToken = pageToken;
      }
      
      console.log(`📡 Fetching users page ${targetPage}...`);
      
      const { usersAPI } = await import('./utils/api');
      const data = await usersAPI.getAll(params);
      
      if (data && data.users) {
        setUsers(data.users);
      }
      
      // Update total count
      if (data && data.total && data.total > 0) {
        setTotalUsersCount(data.total);
        const pages = Math.ceil(data.total / usersPerPage);
        setTotalUsersPages(pages);
        console.log(`📊 Total users: ${data.total}, Total pages: ${pages}`);
      }
      
      // Store next page token for next page
      if (data && data.nextPageToken) {
        setUsersPageTokens(prev => {
          const newMap = new Map(prev);
          newMap.set(targetPage + 1, data.nextPageToken);
          return newMap;
        });
      }
      
      setUsersPageToken(data && data.nextPageToken || null);
      setUsersPage(targetPage);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch users page:', error);
      throw error;
    } finally {
      setIsLoadingUsersPage(false);
    }
  };

  if ((currentView as ViewState) === 'admin-login') {
    return (
      <>
        <Suspense fallback={<Loading fullScreen message="Loading Admin Login..." />}>
          <AdminLogin
            onAdminLogin={handleAdminLogin}
            onNavigateToUserLogin={() => handleNavigate('login')}
            isAdmin={isAdmin}
            user={user}
          />
        </Suspense>
        <Toaster position="bottom-right" expand={true} richColors />
      </>
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
      <>
        <AdminDashboard
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          reviews={reviews}
          setReviews={setReviews}
          chatSessions={chatSessions}
          setChatSessions={setChatSessions}
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
          onSaveSettings={handleSaveHomepageSettings}
          usersPage={usersPage}
          totalUsersCount={totalUsersCount}
          totalUsersPages={totalUsersPages}
          onUsersPageChange={fetchUsersPage}
          isLoadingUsersPage={isLoadingUsersPage}
          isLoadingProducts={isDataLoading || isAdminLoading}
        />
        <Toaster position="bottom-right" expand={true} richColors />
      </>
    );
  }

  // Theme 2 Demo Page
  if (currentView === 'theme2-demo') {
    return (
      <>
        <Theme2Demo />
        <Toaster position="bottom-right" expand={true} richColors />
      </>
    );
  }

  // Theme 3 Demo Page
  if (currentView === 'theme3-demo') {
    return (
      <>
        <Theme3Demo />
        <Toaster position="bottom-right" expand={true} richColors />
      </>
    );
  }

  console.log("App Render:", { currentView, selectedProductId: selectedProduct?.id, productsCount: products.length });

  // Show loading state while data is being fetched (prevents flash of wrong content on direct URL access)
  if (isDataLoading) {
    return (
      <>
        <Loading 
          fullScreen 
          message="Loading Alpha Dentkart..." 
          showProgress={true}
          progress={loadProgress}
          error={dataLoadError}
          onRetry={retryDataLoad}
        />
        <Toaster position="bottom-right" expand={true} richColors />
      </>
    );
  }

  // Show skeleton loaders while data is partially loaded
  const isPartiallyLoaded = !isDataLoading && products.length === 0;

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
        appliedCoupon={appliedCoupon}
        onApplyCoupon={setAppliedCoupon}
        onCheckout={() => {
          setIsCartOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setCurrentView('checkout');
        }}
        onLogin={() => {
          setIsCartOpen(false);
          handleNavigate('login');
        }}
        onGuestCheckout={() => {
          setIsGuestCheckout(true);
          setCurrentView('checkout');
        }}
      />

      <ProductModal
        isOpen={!!quickViewProduct}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
      />

      <Suspense fallback={null}>
      <AIChat
        products={products}
        onProductClick={handleProductClick}
        userName={user?.name}
        isLoggedIn={isLoggedIn}
        onLoginRedirect={() => handleNavigate('login')}
      />
      </Suspense>

      <main className={`container mx-auto px-0 md:px-4 pb-24 md:pb-8 space-y-8 md:space-y-12 flex-1 ${currentView === 'shop' ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <Suspense fallback={<Loading />}>

        {currentView === 'home' && (
          <>
            <div className="space-y-6 md:space-y-8 px-4 md:px-0">
              {products.length > 0 || heroSlides.length > 0 ? (
                <>
                  {brands.length > 0 && (
                    <div className="px-4 md:px-0 mb-4">
                      <BrandScroll onBrandClick={(brand) => navigateToShop(undefined, brand)} brands={brands} />
                    </div>
                  )}
                  <Hero
                    onShopClick={() => navigateToShop()}
                    onProductClick={handleProductClick}
                    onCategoryClick={(category) => navigateToShop(category)}
                    onBrandClick={(brand) => navigateToShop(undefined, brand)}
                    products={products}
                    slides={heroSlides}
                  />
                </>
              ) : (
                <div className="animate-pulse">
                  <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 h-80 md:h-96 rounded-2xl"></div>
                  <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0"></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Premium Categories Box Mesh - Horizontal Auto Scroll */}
            <section className="px-0 relative overflow-hidden">
              <div className="flex justify-between items-end mb-6 px-4 md:px-0">
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

              {/* Gradient Masks for smooth fade out at edges */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent dark:from-surface-dark pointer-events-none z-10 md:hidden"></div>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent dark:from-surface-dark pointer-events-none z-10 md:hidden"></div>

              {!shouldAnimateCategories ? (
                <div className="flex flex-wrap justify-center gap-4 md:gap-8 px-4 py-4">
                  {displayCategories.map(cat => (
                    <a key={`cat-static-${cat.id}`} onClick={() => navigateToShop(cat.name)} className="flex flex-col items-center min-w-[100px] md:min-w-[140px] gap-3 group cursor-pointer">
                      <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-white dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:border-primary/30 group-hover:shadow-premium transition-all duration-500 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        {cat.image ? (
                          <OptimizedImageMemo src={cat.image} alt={cat.name} className="w-12 h-12 md:w-16 md:h-16 object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" width={100} height={100} />
                        ) : (
                          <i className={`${cat.icon || 'fas fa-tooth'} text-2xl md:text-4xl group-hover:scale-110 group-hover:text-primary transition-transform duration-500`}></i>
                        )}
                      </div>
                      <span className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest group-hover:text-primary transition-colors text-center px-1 truncate w-full">
                        {cat.name}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex w-max animate-infinite-scroll hover-pause py-4">
                  {/* First Set */}
                  <div className="flex gap-4 md:gap-6 px-4 md:px-0">
                    {displayCategories.map(cat => (
                      <a key={`cat1-${cat.id}`} onClick={() => navigateToShop(cat.name)} className="flex flex-col items-center min-w-[100px] md:min-w-[140px] gap-3 group cursor-pointer">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-white dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:border-primary/30 group-hover:shadow-premium transition-all duration-500 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {cat.image ? (
                            <OptimizedImageMemo src={cat.image} alt={cat.name} className="w-12 h-12 md:w-16 md:h-16 object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" width={100} height={100} />
                          ) : (
                            <i className={`${cat.icon || 'fas fa-tooth'} text-2xl md:text-4xl group-hover:scale-110 group-hover:text-primary transition-transform duration-500`}></i>
                          )}
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest group-hover:text-primary transition-colors text-center px-1 truncate w-full">
                          {cat.name}
                        </span>
                      </a>
                    ))}
                  </div>
                  {/* Second Set (Duplicate for smooth infinite scroll) */}
                  <div className="flex gap-4 md:gap-6 px-4 md:px-0">
                    {displayCategories.map(cat => (
                      <a key={`cat2-${cat.id}`} onClick={() => navigateToShop(cat.name)} className="flex flex-col items-center min-w-[100px] md:min-w-[140px] gap-3 group cursor-pointer">
                        <div className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] bg-white dark:bg-surface-dark shadow-soft border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:border-primary/30 group-hover:shadow-premium transition-all duration-500 overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          {cat.image ? (
                            <OptimizedImageMemo src={cat.image} alt={cat.name} className="w-12 h-12 md:w-16 md:h-16 object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" width={100} height={100} />
                          ) : (
                            <i className={`${cat.icon || 'fas fa-tooth'} text-2xl md:text-4xl group-hover:scale-110 group-hover:text-primary transition-transform duration-500`}></i>
                          )}
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest group-hover:text-primary transition-colors text-center px-1 truncate w-full">
                          {cat.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
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

            {/* Promo Banners - Dynamic from settings / defaults */}
            <section className="px-4 md:px-0">
              <div className="flex overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 gap-4 md:grid md:grid-cols-3 snap-x scrollbar-hide">
                {displayPromos.map((promo, index) => {
                  const style = getPromoStyles(index);
                  const bgClass = promo.bgColorClass || style.bg;
                  const tagColorClass = promo.tagColorClass || style.tag;
                  return (
                    <div 
                      key={promo.id} 
                      onClick={() => {
                        if (promo.link) {
                          if (promo.link.startsWith('/')) {
                            navigate(promo.link);
                          } else {
                            window.location.href = promo.link;
                          }
                        }
                      }}
                      className={`min-w-[280px] md:min-w-0 w-full ${bgClass} rounded-2xl p-5 md:p-6 flex items-center justify-between relative overflow-hidden group snap-center shadow-sm ${promo.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                    >
                      <div className="z-10 w-1/2">
                        <span className={`text-[10px] font-bold uppercase bg-white dark:bg-surface-dark px-2 py-1 rounded mb-2 inline-block shadow-sm ${tagColorClass}`}>{promo.category}</span>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight mb-2">{promo.title}</h3>
                        <p className="text-primary font-bold text-sm">{promo.price}</p>
                      </div>
                      <OptimizedImageMemo alt={promo.title} className="w-28 h-28 md:w-32 md:h-32 object-contain absolute -right-2 -bottom-2 md:right-4 group-hover:scale-110 transition-transform duration-500" src={promo.image} width={200} height={200} />
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Dynamic Product Sections (Categories & Brands) */}
            {(() => {
              const categorySections = settings?.showcaseCategories !== undefined
                ? settings.showcaseCategories
                : ['Restorative', 'Endodontics', 'Equipment'];
              
              const brandSections = (brands || [])
                .filter(b => b.isFeatured)
                .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
                .map(b => b.name);
              
              const allSections = [
                ...brandSections.map(name => ({ name, type: 'brand' }))
              ];

              const styles = [
                { bg: 'bg-blue-600/10 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'fas fa-fill' },
                { bg: 'bg-teal-600/10 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400', icon: 'fas fa-tooth' },
                { bg: 'bg-cyan-600/10 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-400', icon: 'fas fa-stethoscope' },
                { bg: 'bg-indigo-600/10 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', icon: 'fas fa-vial' },
                { bg: 'bg-purple-600/10 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', icon: 'fas fa-clinic-medical' }
              ];

              return allSections.map((section, idx) => {
                const sectionProducts = section.type === 'category' 
                  ? products.filter(p => {
                      const catName = typeof p.category === 'object' ? (p.category as any)?.name : p.category;
                      return catName?.trim().toLowerCase() === section.name.trim().toLowerCase();
                    }).slice(0, 4)
                  : products.filter(p => {
                      const brandName = typeof p.brand === 'object' ? (p.brand as any)?.name : p.brand;
                      return brandName?.trim().toLowerCase() === section.name.trim().toLowerCase();
                    }).slice(0, 4);
                
                if (sectionProducts.length === 0) {
                  if (products.length > 0) {
                    console.log(`[Homepage] Section "${section.name}" (${section.type}) is empty. Products available: ${products.length}`);
                  }
                  return null;
                }

                const style = styles[idx % styles.length];
                let title = section.name;
                let icon = style.icon;

                if (section.type === 'category') {
                  const catObj = categories.find(c => c.name === section.name);
                  if (catObj?.iconClass) icon = catObj.iconClass;
                  // Only add "Supplies" if title doesn't already sound like a collection
                  const lowerTitle = section.name.toLowerCase();
                  if (!lowerTitle.includes('supplies') && !lowerTitle.includes('essentials') && !lowerTitle.includes('equipment')) {
                    title = `${section.name} Supplies`;
                  }
                } else {
                  title = `${section.name} Collection`;
                  icon = 'fas fa-certificate'; 
                }

                return (
                  <div key={`section-${section.type}-${section.name}`}>
                    {renderProductSection(title, sectionProducts, icon, style.bg, style.text)}
                  </div>
                );
              });
            })()}

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
              categories={categories || []}
              brands={brands || []}
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
            <Login 
              onLogin={handleLogin} 
              onNavigateToRegister={() => setCurrentView('register')} 
              onNavigateToForgotPassword={() => setCurrentView('forgot-password')}
            />
          )}

          {currentView === 'register' && (
            <Register onRegister={handleRegister} onNavigateToLogin={() => setCurrentView('login')} />
          )}

          {currentView === 'forgot-password' && (
            <ForgotPassword onNavigateBack={() => setCurrentView('login')} />
          )}

          {currentView === 'dashboard' && user && (
            <Dashboard user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} refreshOrders={refreshOrders} />
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

          {/* Checkout - Cart Empty */}
          {currentView === 'checkout' && (!cart || cart.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
              <i className="fas fa-shopping-cart text-5xl text-gray-300 mb-4"></i>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Add some products to your cart first.</p>
              <button
                onClick={() => navigateToShop()}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
              >
                Continue Shopping
              </button>
            </div>
          )}

          {/* Checkout - Guest Checkout */}
          {currentView === 'checkout' && cart && cart.length > 0 && (!user || user === null) && isGuestCheckout && (
            <div className="bg-gray-50 dark:bg-background-dark min-h-[60vh]">
              <GuestCheckout
                cart={cart}
                onOrderSuccess={(orderId) => {
                  setCart([]);
                  setIsGuestCheckout(false);
                  toast.success('Order placed successfully! Order ID: ' + orderId);
                  setCurrentView('shop');
                }}
                onCancel={() => {
                  setIsGuestCheckout(false);
                  setCurrentView('shop');
                }}
              />
            </div>
          )}

          {/* Checkout - Login Required (with Guest option) */}
          {currentView === 'checkout' && cart && cart.length > 0 && (!user || user === null) && !isGuestCheckout && (
            <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
              <i className="fas fa-lock text-5xl text-gray-300 mb-4"></i>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Checkout</h2>
              <p className="text-gray-500 mb-6">Login for a faster checkout experience or continue as guest.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleNavigate('login')}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  Login
                </button>
                <button
                  onClick={() => setIsGuestCheckout(true)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}

          {/* Checkout - User Logged In with Items */}
          {currentView === 'checkout' && cart && cart.length > 0 && user && (
            <div className="bg-gray-50 dark:bg-background-dark min-h-[60vh]">
              <Checkout
                cart={cart}
                user={user}
                onUpdateUser={handleUpdateUser}
                onPlaceOrder={handlePlaceOrder}
                onNavigateBack={() => navigateToShop()}
                razorpayKey={settings.payment?.razorpay?.keyId}
                appliedCoupon={appliedCoupon}
                onApplyCoupon={setAppliedCoupon}
                settings={settings}
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

        </Suspense>
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
      <Toaster position="bottom-right" expand={true} richColors />
    </div>
  );
}

export default App;


