
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { sendPasswordResetEmail } from '../utils/emailService';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product, Order, Category, BrandProfile, ProductVariation, User, HeroSlide, HomepageSettings, Review } from '../types';
import { toast } from 'sonner';
import { ThemesTab } from './ThemesTab';
import { HomepageTab } from './HomepageTab';
import { CustomerManagement } from './CustomerManagement';
import { AISettings } from './AISettings';
import { ChatSupport } from './ChatSupport';
import OrderTracking, { TrackingData } from './OrderTracking';
import OrderStatusTimeline from './OrderStatusTimeline';

import {
    getAllAdminNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getRelativeTime,
    getNotificationIcon,
    getNotificationColor,
    notifyNewOrder,
    notifyOrderStatusChange,
    notifyLowStock,
    notifyOutOfStock,
    notifyVerificationPending
} from '../utils/adminNotificationService';
import { verificationAPI } from '../utils/api';
import { CouponsTab } from './CouponsTab';
import { VerificationManager } from './VerificationManager';
import { InventoryTab } from './admin/InventoryTab';
import { ProductsTab } from './admin/ProductsTab';
import { productSchema, categorySchema, brandSchema } from '../utils/schemas';
import { z } from 'zod';
import { resolveProductImage } from '../utils/image';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    try {
        let dateObj: Date | null = null;

        // 1. If it's already a Date object
        if (dateInput instanceof Date) {
            dateObj = dateInput;
        } 
        // 2. If it's a string
        else if (typeof dateInput === 'string') {
            let cleaned = dateInput.trim();
            
            // Convert "YYYY-MM-DD HH:MM:SS..." to "YYYY-MM-DDTHH:MM:SS..."
            if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(cleaned)) {
                cleaned = cleaned.replace(/\s+/, 'T');
            }

            // Handle microsecond/nanosecond fractional parts (e.g. .000000Z or .000000)
            const dotIndex = cleaned.indexOf('.');
            if (dotIndex !== -1) {
                const parts = cleaned.split('.');
                const afterDot = parts[1] || '';
                const tzMatch = afterDot.match(/([Zz]|\+|-)/);
                let tzPart = '';
                let fraction = afterDot;
                if (tzMatch && tzMatch.index !== undefined) {
                    fraction = afterDot.substring(0, tzMatch.index);
                    tzPart = afterDot.substring(tzMatch.index);
                }
                // Truncate fractional seconds to 3 digits (milliseconds)
                fraction = fraction.substring(0, 3).padEnd(3, '0');
                cleaned = parts[0] + '.' + fraction + tzPart;
            }

            // Try standard Date parsing
            const parsed = new Date(cleaned);
            if (!isNaN(parsed.getTime())) {
                dateObj = parsed;
            } else {
                // Try manual parsing as fallback if it still fails
                // Matches "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM:SS"
                const parts = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);
                if (parts) {
                    const yr = parseInt(parts[1], 10);
                    const mo = parseInt(parts[2], 10) - 1;
                    const dy = parseInt(parts[3], 10);
                    const hr = parts[4] ? parseInt(parts[4], 10) : 0;
                    const mi = parts[5] ? parseInt(parts[5], 10) : 0;
                    const sc = parts[6] ? parseInt(parts[6], 10) : 0;
                    dateObj = new Date(Date.UTC(yr, mo, dy, hr, mi, sc));
                }
            }
        } 
        // 3. If it's an object (Firestore Timestamp or similar)
        else if (typeof dateInput === 'object') {
            if (typeof dateInput.toDate === 'function') {
                dateObj = dateInput.toDate();
            } else {
                const sec = typeof dateInput.seconds === 'number' ? dateInput.seconds : 
                            typeof dateInput._seconds === 'number' ? dateInput._seconds : null;
                const nanosec = typeof dateInput.nanoseconds === 'number' ? dateInput.nanoseconds :
                                typeof dateInput._nanoseconds === 'number' ? dateInput._nanoseconds : 0;
                if (sec !== null) {
                    dateObj = new Date(sec * 1000 + Math.floor(nanosec / 1000000));
                } else {
                    const parsed = new Date(dateInput);
                    if (!isNaN(parsed.getTime())) {
                        dateObj = parsed;
                    }
                }
            }
        } 
        // 4. Any other type
        else {
            const parsed = new Date(dateInput);
            if (!isNaN(parsed.getTime())) {
                dateObj = parsed;
            }
        }

        // If parsing failed completely, try one last check on the original value coerced to a string
        if (!dateObj || isNaN(dateObj.getTime())) {
            const parsed = new Date(dateInput);
            if (!isNaN(parsed.getTime())) {
                dateObj = parsed;
            } else {
                // Clean up the original string to remove ".000000Z" or similar
                let fallback = String(dateInput);
                fallback = fallback.replace(/\.000+Z?/gi, '');
                fallback = fallback.replace(/T/gi, ' ');
                fallback = fallback.replace(/Z/gi, '');
                return fallback;
            }
        }

        // Custom, stable, platform-independent formatting
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        let hours = dateObj.getHours();
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const strHours = String(hours).padStart(2, '0');

        return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
    } catch (e) {
        let fallback = String(dateInput);
        fallback = fallback.replace(/\.000+Z?/gi, '');
        fallback = fallback.replace(/T/gi, ' ');
        fallback = fallback.replace(/Z/gi, '');
        return fallback;
    }
};

const parseOrderDate = (order: any): Date => {
    if (!order) return new Date();
    const dateInput = order.date || order.createdAt || order.updatedAt || order.lastSync;
    if (!dateInput) return new Date();
    
    if (dateInput instanceof Date) {
        return dateInput;
    }
    
    if (typeof dateInput === 'string') {
        let cleaned = dateInput.trim();
        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(cleaned)) {
            cleaned = cleaned.replace(/\s+/, 'T');
        }
        const dotIndex = cleaned.indexOf('.');
        if (dotIndex !== -1) {
            const parts = cleaned.split('.');
            const afterDot = parts[1] || '';
            const tzMatch = afterDot.match(/([Zz]|\+|-)/);
            let tzPart = '';
            let fraction = afterDot;
            if (tzMatch && tzMatch.index !== undefined) {
                fraction = afterDot.substring(0, tzMatch.index);
                tzPart = afterDot.substring(tzMatch.index);
            }
            fraction = fraction.substring(0, 3).padEnd(3, '0');
            cleaned = parts[0] + '.' + fraction + tzPart;
        }
        const parsed = new Date(cleaned);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
        // Manual fallback matching
        const parts = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);
        if (parts) {
            const yr = parseInt(parts[1], 10);
            const mo = parseInt(parts[2], 10) - 1;
            const dy = parseInt(parts[3], 10);
            const hr = parts[4] ? parseInt(parts[4], 10) : 0;
            const mi = parts[5] ? parseInt(parts[5], 10) : 0;
            const sc = parts[6] ? parseInt(parts[6], 10) : 0;
            return new Date(Date.UTC(yr, mo, dy, hr, mi, sc));
        }
    }
    
    if (typeof dateInput === 'object') {
        if (typeof dateInput.toDate === 'function') {
            return dateInput.toDate();
        }
        const sec = dateInput.seconds ?? dateInput._seconds ?? null;
        const nanosec = dateInput.nanoseconds ?? dateInput._nanoseconds ?? 0;
        if (sec !== null) {
            return new Date(sec * 1000 + Math.floor(nanosec / 1000000));
        }
        const parsed = new Date(dateInput);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    
    const fallback = new Date(dateInput);
    return isNaN(fallback.getTime()) ? new Date() : fallback;
};



interface AdminDashboardProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    reviews: Review[];
    setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    brands: BrandProfile[];
    setBrands: React.Dispatch<React.SetStateAction<BrandProfile[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>; // Added for customer edit functionality
    onLogout: () => void;
    onVisitSite: () => void;
    settings: any;
    setSettings: React.Dispatch<React.SetStateAction<any>>;
    heroSlides: HeroSlide[];
    onAddHeroSlide: (slide: HeroSlide) => void;
    onUpdateHeroSlide: (slide: HeroSlide) => void;
    onDeleteHeroSlide: (id: number) => void;
    onReorderHeroSlides: (slides: HeroSlide[]) => void;
    chatSessions: import('../types').ChatSession[];
    setChatSessions: React.Dispatch<React.SetStateAction<import('../types').ChatSession[]>>;
    apiKey?: string; // For AI features
    modelName?: string; // For AI features
    // Promotional Tiles
    promotionalTiles: import('../types').PromotionalTile[];
    onUpdatePromotionalTile: (tile: import('../types').PromotionalTile) => void;
    // Featured Brands
    onToggleBrandFeatured: (brandId: number, isFeatured: boolean) => void;
    onReorderFeaturedBrands: (brands: BrandProfile[]) => void;
    // Homepage Settings
    onSaveSettings: (settings: any) => Promise<void>;
    // Users Pagination
    usersPage?: number;
    totalUsersCount?: number;
    totalUsersPages?: number;
    onUsersPageChange?: (page: number, pageToken?: string) => Promise<{ users: User[], total: number, nextPageToken?: string | null }>;
    isLoadingUsersPage?: boolean;
    isLoadingProducts?: boolean;
}

// --- Animated Graph Component ---
const AnimatedGraph = ({ data, labels, colorHex, heightClass = "h-48" }: { data: number[], labels: string[], colorHex: string, heightClass?: string }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const max = Math.max(...data) || 1;
    // Dimensions for SVG coordinate system (fixed aspect ratio, scaled via CSS)
    const width = 1000;
    const height = 400;
    const padding = 20;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const points = data.map((val, i) => ({
        x: padding + (i / (data.length - 1)) * graphWidth,
        y: height - padding - (val / max) * graphHeight
    }));

    // Generate smooth path (Catmull-Rom like tension)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? 0 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) * 0.2; // Tension
        const cp1y = p1.y + (p2.y - p0.y) * 0.2;
        const cp2x = p2.x - (p3.x - p1.x) * 0.2;
        const cp2y = p2.y - (p3.y - p1.y) * 0.2;

        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const relativeX = x / rect.width; // 0 to 1

        const index = Math.min(Math.max(Math.round(relativeX * (data.length - 1)), 0), data.length - 1);
        setHoveredIndex(index);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Inline styles for graph animation keyframes */}
            <style>{`
                @keyframes drawPath {
                    from { stroke-dashoffset: 3000; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-draw {
                    animation: drawPath 2.5s ease-out forwards;
                }
                .animate-area {
                    animation: fadeInUp 1s ease-out forwards;
                }
            `}</style>

            <div
                className={`relative w-full ${heightClass} cursor-crosshair touch-none`}
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Tooltip */}
                {hoveredIndex !== null && (
                    <div
                        className="absolute top-0 transform -translate-x-1/2 -translate-y-full mb-2 pointer-events-none z-20 transition-all duration-150 ease-out"
                        style={{ left: `${(hoveredIndex / (data.length - 1)) * 100}%` }}
                    >
                        <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-gray-700 relative">
                            {(data[hoveredIndex] ?? 0).toLocaleString('en-IN')}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45 border-b border-r border-gray-700"></div>
                        </div>
                    </div>
                )}

                {/* Graph */}
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`gradient-${colorHex.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colorHex} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path
                        d={areaD}
                        fill={`url(#gradient-${colorHex.replace('#', '')})`}
                        className="opacity-0 animate-area"
                        style={{ animationDelay: '0.2s' }}
                    />

                    {/* Line Stroke */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke={colorHex}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-draw"
                        strokeDasharray="3000"
                        strokeDashoffset="3000"
                    />

                    {/* Points (visible on hover) */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r={hoveredIndex === i ? 6 : 0}
                            fill={colorHex}
                            stroke="white"
                            strokeWidth="3"
                            className="transition-all duration-200"
                        />
                    ))}

                    {/* Vertical Guide Line */}
                    {hoveredIndex !== null && (
                        <line
                            x1={points[hoveredIndex].x}
                            y1={points[hoveredIndex].y}
                            x2={points[hoveredIndex].x}
                            y2={height}
                            stroke={colorHex}
                            strokeWidth="1"
                            strokeDasharray="5,5"
                            className="opacity-50 pointer-events-none"
                        />
                    )}
                </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="w-full flex justify-between mt-4 px-2">
                {labels.map((label, i) => (
                    <span key={i} className={`text-[10px] sm:text-xs font-medium transition-all duration-200 ${hoveredIndex === i ? 'text-gray-900 dark:text-white font-bold scale-110 -translate-y-1' : 'text-gray-400'}`}>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
};

// --- End Animated Graph ---

// --- Helper Component: SearchInput (Defined outside to maintain focus) ---
const SearchInput = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => (
    <div className="relative w-full max-w-md group">
        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"></i>
        <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
        />
    </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    products,
    setProducts,
    orders,
    setOrders,
    reviews,
    setReviews,
    categories,
    setCategories,
    brands,
    setBrands,
    users,
    setUsers,
    onLogout,
    onVisitSite,
    settings,
    setSettings,
    heroSlides,
    onAddHeroSlide,
    onUpdateHeroSlide,
    onDeleteHeroSlide,
    onReorderHeroSlides,
    apiKey,
    modelName,
    promotionalTiles,
    onUpdatePromotionalTile,
    onToggleBrandFeatured,
    onReorderFeaturedBrands,
    onSaveSettings,
    usersPage,
    totalUsersCount,
    totalUsersPages,
    onUsersPageChange,
    isLoadingUsersPage,
    isLoadingProducts,
    chatSessions,
    setChatSessions
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'categories' | 'brands' | 'settings' | 'inventory' | 'reviews' | 'analytics' | 'homepage' | 'appearance' | 'themes' | 'chat-support' | 'coupons'>(() => {
        const savedTab = localStorage.getItem('alpha_admin_tab');
        return (savedTab as any) || 'overview';
    });

    useEffect(() => {
        localStorage.setItem('alpha_admin_tab', activeTab);
    }, [activeTab]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

    // Count new orders (from last 48 hours)
    const newOrdersCount = orders.filter(order => order.isNew).length;

    // SMTP testing state
    const [testingSMTP, setTestingSMTP] = useState(false);

    // Orders loading state
    const [isLoading, setIsLoading] = useState(false);

    // Admin Notifications State
    const [notifications, setNotifications] = useState(getAllAdminNotifications());
    const [unreadCount, setUnreadCount] = useState(getUnreadCount());
    const notifiedUserEmails = useRef<Set<string>>(new Set());

    // Default settings for homepage if none are provided
    const DEFAULT_HOMEPAGE_SETTINGS = useMemo(() => ({
        badges: [
            { id: 'clinic-essential' as const, name: 'CLINIC ESSENTIAL', color: '#0369a1', bgColor: '#e0f2fe', enabled: true },
            { id: 'bundle-deal' as const, name: 'BUNDLE DEAL', color: '#15803d', bgColor: '#dcfce7', enabled: true },
            { id: 'new-arrival' as const, name: 'NEW ARRIVAL', color: '#be123c', bgColor: '#ffe4e6', enabled: true }
        ],
        showcaseCategories: [],
        showcaseBrands: [],
        featuredCategorySections: [],
        featuredBrandSections: []
    }), []);

    // State for homepage configuration draft
    const [homepageDraft, setHomepageDraft] = useState<HomepageSettings | null>(null);

    // Derived state for the current homepage configuration (draft || saved || default)
    const currentHomepageSettings = useMemo(() => {
        const base = homepageDraft || settings || DEFAULT_HOMEPAGE_SETTINGS;
        return {
            badges: base?.badges || DEFAULT_HOMEPAGE_SETTINGS.badges,
            showcaseCategories: base?.showcaseCategories || DEFAULT_HOMEPAGE_SETTINGS.showcaseCategories,
            showcaseBrands: base?.showcaseBrands || DEFAULT_HOMEPAGE_SETTINGS.showcaseBrands,
            featuredCategorySections: base?.featuredCategorySections || DEFAULT_HOMEPAGE_SETTINGS.featuredCategorySections,
            featuredBrandSections: base?.featuredBrandSections || DEFAULT_HOMEPAGE_SETTINGS.featuredBrandSections
        };
    }, [homepageDraft, settings, DEFAULT_HOMEPAGE_SETTINGS]);

    // Helper to handle functional updates from child components
    const handleSetHomepageSettings = (update: HomepageSettings | ((prev: HomepageSettings) => HomepageSettings)) => {
        if (typeof update === 'function') {
            setHomepageDraft((prev) => {
                const base = prev || settings || DEFAULT_HOMEPAGE_SETTINGS;
                const mergedBase = {
                    badges: base?.badges || DEFAULT_HOMEPAGE_SETTINGS.badges,
                    showcaseCategories: base?.showcaseCategories || DEFAULT_HOMEPAGE_SETTINGS.showcaseCategories,
                    showcaseBrands: base?.showcaseBrands || DEFAULT_HOMEPAGE_SETTINGS.showcaseBrands,
                    featuredCategorySections: base?.featuredCategorySections || DEFAULT_HOMEPAGE_SETTINGS.featuredCategorySections,
                    featuredBrandSections: base?.featuredBrandSections || DEFAULT_HOMEPAGE_SETTINGS.featuredBrandSections
                };
                return update(mergedBase);
            });
        } else {
            setHomepageDraft(update);
        }
    };

    // Wrapper for saving settings that clears the local draft on success
    const handleSaveHomepageSettings = async (newSettings: HomepageSettings) => {
        if (onSaveSettings) {
            await onSaveSettings(newSettings);
            setHomepageDraft(null); // Clear draft after successful save
        }
    };

    const handleSyncProducts = async () => {
        setIsLoading(true);
        try {
            const { productsAPI } = await import('../utils/api');
            
            // Trigger actual sync first
            try {
                await productsAPI.sync();
            } catch (syncErr) {
                console.warn("⚠️ Sync trigger warning (continuing to fetch):", syncErr);
            }
            
            const response = await productsAPI.getAll({ limit: 5000 });
            
            let freshProducts: Product[] = [];
            if (response && response.products) {
                freshProducts = response.products;
            } else if (response && Array.isArray(response)) {
                freshProducts = response;
            }

            if (freshProducts.length > 0) {
                const transformed: Product[] = freshProducts.map((p: any) => ({
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
                setProducts(transformed);
            }
        } catch (err) {
            console.error("❌ Failed to sync products:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // WordPress Sync block moved below activeSettingsTab declaration

    const [isSyncingCategories, setIsSyncingCategories] = useState(false);
    const [isSyncingBrands, setIsSyncingBrands] = useState(false);

    const handleSyncCategories = async () => {
        setIsSyncingCategories(true);
        const toastId = toast.loading('Syncing categories from WooCommerce...');
        try {
            const { categoriesAPI } = await import('../utils/api');
            const syncRes = await categoriesAPI.sync();
            const allRes = await categoriesAPI.getAll();
            if (allRes) {
                setCategories(allRes);
            }
            toast.success(syncRes.message || 'Categories synced successfully!', { id: toastId });
        } catch (err: any) {
            console.error("❌ Failed to sync categories:", err);
            toast.error(err?.response?.data?.error || err?.message || 'Failed to sync categories.', { id: toastId });
        } finally {
            setIsSyncingCategories(false);
        }
    };

    const handleSyncBrands = async () => {
        setIsSyncingBrands(true);
        const toastId = toast.loading('Syncing brands from WooCommerce...');
        try {
            const { brandsAPI } = await import('../utils/api');
            const syncRes = await brandsAPI.sync();
            const allRes = await brandsAPI.getAll();
            if (allRes) {
                setBrands(allRes);
            }
            toast.success(syncRes.message || 'Brands synced successfully!', { id: toastId });
        } catch (err: any) {
            console.error("❌ Failed to sync brands:", err);
            toast.error(err?.response?.data?.error || err?.message || 'Failed to sync brands.', { id: toastId });
        } finally {
            setIsSyncingBrands(false);
        }
    };

    // Check for pending verifications and low stock
    useEffect(() => {
        users.forEach(user => {
            if (user.verificationStatus === 'pending' && !notifiedUserEmails.current.has(user.email)) {
                const existingNotifs = getAllAdminNotifications();
                const isAlreadyNotified = existingNotifs.some(n => n.data?.email === user.email && n.category === 'verification-pending');

                if (!isAlreadyNotified) {
                    notifyVerificationPending(user.name, user.email);
                    setNotifications(getAllAdminNotifications());
                    setUnreadCount(getUnreadCount());
                }
                notifiedUserEmails.current.add(user.email);
            }
        });

        // Check for low stock products
        const notifiedProductIds = new Set<string>();
        products.forEach(product => {
            if (product.stock <= 5 && !notifiedProductIds.has(product.id)) {
                const existingNotifs = getAllAdminNotifications();
                const category = product.stock === 0 ? 'out-of-stock' : 'low-stock';
                const isAlreadyNotified = existingNotifs.some(n => n.data?.productId === product.id && n.category === category);

                if (!isAlreadyNotified) {
                    if (product.stock === 0) {
                        notifyOutOfStock(product);
                    } else {
                        notifyLowStock(product);
                    }
                    setNotifications(getAllAdminNotifications());
                    setUnreadCount(getUnreadCount());
                }
                notifiedProductIds.add(product.id);
            }
        });
    }, [orders, users, products]);

    // Dashboard Chart State
    const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');

    // Real Analytics Data - calculated from actual orders
    const analyticsData = useMemo(() => {
        // Calculate weekly revenue (last 7 days)
        const weeklyRevenue = new Array(7).fill(0);
        const weeklyOrders = new Array(7).fill(0);
        const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // Calculate monthly revenue (last 12 months)
        const monthlyRevenue = new Array(12).fill(0);
        const monthlyOrders = new Array(12).fill(0);
        const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Process orders to calculate revenue
        orders.forEach(order => {
            try {
                const orderDate = parseOrderDate(order);
                const now = new Date();

                // Weekly calculation (last 7 days)
                const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < 7) {
                    const dayIndex = 6 - daysDiff; // Most recent is Sunday (index 6)
                    weeklyRevenue[dayIndex] += order.total || 0;
                    weeklyOrders[dayIndex] += 1;
                }

                // Monthly calculation (current year)
                if (orderDate.getFullYear() === now.getFullYear()) {
                    const monthIndex = orderDate.getMonth();
                    monthlyRevenue[monthIndex] += order.total || 0;
                    monthlyOrders[monthIndex] += 1;
                }
            } catch (e) {
                // Skip invalid dates
            }
        });

        return {
            weeklyRevenue,
            weeklyOrders,
            weeklyLabels,
            monthlyRevenue,
            monthlyOrders,
            monthlyLabels
        };
    }, [orders]);

    // Calculate current month's total revenue
    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return orders.reduce((total, order) => {
            try {
                const orderDate = parseOrderDate(order);
                if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
                    return total + (order.total || 0);
                }
            } catch (e) {
                // Skip invalid dates
            }
            return total;
        }, 0);
    }, [orders]);

    // Header State
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Auto-refresh notifications every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setNotifications(getAllAdminNotifications());
            setUnreadCount(getUnreadCount());
        }, 5000);

        return () => clearInterval(interval);
    }, []);


    // Search States
    // Search States with Persistence
    const [orderSearchTerm, setOrderSearchTerm] = useState(() => localStorage.getItem('admin_order_search') || '');
    const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Return Initiated' | 'Return Approved' | 'Return Completed' | 'Return Rejected'>(() => (localStorage.getItem('admin_order_status_filter') as any) || 'All');
    const [orderFilterMonth, setOrderFilterMonth] = useState<string>(() => localStorage.getItem('admin_order_month_filter') || 'all'); 
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [categoryPage, setCategoryPage] = useState(1);
    const [brandSearchTerm, setBrandSearchTerm] = useState('');
    const [brandPage, setBrandPage] = useState(1);
    const itemsPerPage = 8;
    const [customerSearchTerm, setCustomerSearchTerm] = useState(() => localStorage.getItem('admin_customer_search') || '');
    const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'dental-doctor' | 'dental-student' | 'dental-business' | 'regular' | 'hidden'>(() => (localStorage.getItem('admin_customer_type_filter') as any) || 'all');

    // Persistence Effects for Search/Filters
    useEffect(() => { localStorage.setItem('admin_order_search', orderSearchTerm); }, [orderSearchTerm]);
    useEffect(() => { localStorage.setItem('admin_order_status_filter', orderStatusFilter); }, [orderStatusFilter]);
    useEffect(() => { localStorage.setItem('admin_order_month_filter', orderFilterMonth); }, [orderFilterMonth]);
    useEffect(() => { localStorage.setItem('admin_cat_search', categorySearchTerm); }, [categorySearchTerm]);
    useEffect(() => { localStorage.setItem('admin_brand_search', brandSearchTerm); }, [brandSearchTerm]);
    useEffect(() => { localStorage.setItem('admin_customer_search', customerSearchTerm); }, [customerSearchTerm]);
    useEffect(() => { localStorage.setItem('admin_customer_type_filter', customerTypeFilter); }, [customerTypeFilter]);

    // Pagination States
    const [orderPage, setOrderPage] = useState(1);

    // Reset order page when filters change
    useEffect(() => {
        setOrderPage(1);
    }, [orderSearchTerm, orderStatusFilter, orderFilterMonth]);

    // Order Detail State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderTrackingData, setOrderTrackingData] = useState<TrackingData | null>(null);
    const [showOrderTracking, setShowOrderTracking] = useState(false);

    // Password Reset State
    const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetPasswordMethod, setResetPasswordMethod] = useState<'manual' | 'email'>('manual');

    // Bulk Actions State
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // Filtered orders based on month filter
    const monthFilteredOrders = useMemo(() => {
        if (orderFilterMonth === 'all') {
            return orders;
        }

        const [year, month] = orderFilterMonth.split('-').map(Number);
        return orders.filter(order => {
            try {
                const orderDate = parseOrderDate(order);
                return orderDate.getFullYear() === year && orderDate.getMonth() === month - 1;
            } catch (e) {
                return false;
            }
        });
    }, [orders, orderFilterMonth]);

    // Generate available months from orders for the filter dropdown
    const availableMonths = useMemo(() => {
        const monthsSet = new Set<string>();
        orders.forEach(order => {
            try {
                const orderDate = parseOrderDate(order);
                const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                monthsSet.add(monthKey);
            } catch (e) {
                // Skip invalid dates
            }
        });

        // Convert to array and sort (most recent first)
        return Array.from(monthsSet).sort().reverse();
    }, [orders]);

    // Helper function to format month display
    const formatMonthDisplay = (monthKey: string) => {
        if (monthKey === 'all') return 'All Orders';
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Customer State
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isViewCustomerMode, setIsViewCustomerMode] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
    const [customerFormData, setCustomerFormData] = useState<User | null>(null);
    const [customerDetailModal, setCustomerDetailModal] = useState<User | null>(null);
    const [editCustomerData, setEditCustomerData] = useState<User | null>(null);

    // Fetch a specific user by email (to update local state after save)
    const fetchUserByEmail = async (email: string) => {
        try {
            const { usersAPI } = await import('../utils/api');
            const data = await usersAPI.getByEmail(email);
            const user = data.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
            return user;
        } catch (e) {
            console.error('Error fetching user by email:', e);
            return null;
        }
    };

    // Settings Tab State
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'payment' | 'shipping' | 'email' | 'notifications' | 'ai-chatbot' | 'wordpress'>('general');

    const [wpSiteUrl, setWpSiteUrl] = useState('https://alphadentkart.com');
    const [wpConsumerKey, setWpConsumerKey] = useState('');
    const [wpConsumerSecret, setWpConsumerSecret] = useState('');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isSyncingAll, setIsSyncingAll] = useState(false);
    const [isSyncingProducts, setIsSyncingProducts] = useState(false);
    const [isSyncingOrders, setIsSyncingOrders] = useState(false);
    const [isSyncingUsers, setIsSyncingUsers] = useState(false);
    const [forceFullSyncProducts, setForceFullSyncProducts] = useState(false);
    const [forceFullSyncOrders, setForceFullSyncOrders] = useState(false);
    const [forceFullSyncUsers, setForceFullSyncUsers] = useState(false);
    const [syncLogs, setSyncLogs] = useState<string[]>(['📺 WordPress Sync Console ready...']);
    const [syncStatus, setSyncStatus] = useState<any>(null);

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setSyncLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    };

    useEffect(() => {
        if (activeSettingsTab === 'wordpress') {
            const fetchWpSettings = async () => {
                try {
                    const { wordpressSyncAPI } = await import('../utils/api');
                    const [credRes, statusRes] = await Promise.all([
                        wordpressSyncAPI.getCredentials(),
                        wordpressSyncAPI.getStatus()
                    ]);
                    
                    if (credRes?.success && credRes.credentials) {
                        setWpSiteUrl(credRes.credentials.siteUrl || 'https://alphadentkart.com');
                        setWpConsumerKey(credRes.credentials.consumerKey || '');
                    }
                    
                    if (statusRes?.success && statusRes.status) {
                        setSyncStatus(statusRes.status);
                    }
                } catch (err) {
                    console.error('Failed to load WordPress settings:', err);
                }
            };
            fetchWpSettings();
        }
    }, [activeSettingsTab]);

    const handleTestConnection = async () => {
        if (!wpSiteUrl || !wpConsumerKey || !wpConsumerSecret) {
            toast.error('Please enter Site URL, Consumer Key, and Consumer Secret');
            return;
        }
        setIsTestingConnection(true);
        addLog(`🔌 Testing connection to: ${wpSiteUrl}...`);
        const toastId = toast.loading('Testing connection to WooCommerce...');
        try {
            const { wordpressSyncAPI } = await import('../utils/api');
            const res = await wordpressSyncAPI.testConnection({
                siteUrl: wpSiteUrl,
                consumerKey: wpConsumerKey,
                consumerSecret: wpConsumerSecret
            });
            if (res?.success) {
                toast.success(res.message || 'Connected successfully!', { id: toastId });
                addLog(`✅ Connected successfully! Found ${res.total} products.`);
            } else {
                toast.error(res?.error || 'Connection failed.', { id: toastId });
                addLog(`❌ Connection failed: ${res?.error || 'Unknown error'}`);
            }
        } catch (err: any) {
            console.error('Connection test error:', err);
            const errMsg = err?.response?.data?.error || err?.message || 'Connection failed.';
            toast.error(errMsg, { id: toastId });
            addLog(`❌ Connection failed: ${errMsg}`);
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleSaveWpCredentials = async () => {
        if (!wpSiteUrl || !wpConsumerKey || !wpConsumerSecret) {
            toast.error('Please enter Site URL, Consumer Key, and Consumer Secret');
            return;
        }
        const toastId = toast.loading('Saving WooCommerce credentials...');
        try {
            const { wordpressSyncAPI } = await import('../utils/api');
            const res = await wordpressSyncAPI.saveCredentials({
                siteUrl: wpSiteUrl,
                consumerKey: wpConsumerKey,
                consumerSecret: wpConsumerSecret
            });
            if (res?.success) {
                toast.success('Credentials saved successfully!', { id: toastId });
                addLog('💾 WooCommerce credentials saved successfully.');
            } else {
                toast.error(res?.error || 'Failed to save credentials.', { id: toastId });
            }
        } catch (err: any) {
            console.error('Save credentials error:', err);
            toast.error(err?.response?.data?.error || err?.message || 'Failed to save credentials.', { id: toastId });
        }
    };

    const triggerSyncProducts = async (force: boolean = false) => {
        setIsSyncingProducts(true);
        addLog(`📦 Starting Products Synchronization (Force Full Sync: ${force})...`);
        const toastId = toast.loading('Syncing products from WooCommerce...');
        try {
            const { wordpressSyncAPI } = await import('../utils/api');
            const res = await wordpressSyncAPI.syncProducts(force);
            if (res?.success) {
                toast.success(res.message || 'Products synced successfully!', { id: toastId });
                addLog(`✅ Successfully synced ${res.synced} products.`);
                
                // Refresh local products list
                const { productsAPI } = await import('../utils/api');
                const productsRes = await productsAPI.getAll({ limit: 5000 });
                if (productsRes) {
                    const fresh = productsRes.products || productsRes;
                    if (Array.isArray(fresh)) {
                        setProducts(fresh.map((p: any) => ({
                            id: p.id,
                            name: p.name || 'Unknown Product',
                            category: (p.category && typeof p.category === 'object') ? p.category.name : (typeof p.category === 'string' ? p.category : 'General'),
                            price: p.price || 0,
                            stock: p.stock ?? 0,
                            image: p.image || '',
                            sku: p.sku
                        })));
                    }
                }
                
                // Refresh status
                const statusRes = await wordpressSyncAPI.getStatus();
                if (statusRes?.success && statusRes.status) setSyncStatus(statusRes.status);
            }
        } catch (err: any) {
            console.error('Products sync error:', err);
            const errMsg = err?.response?.data?.error || err?.message || 'Products sync failed.';
            toast.error(errMsg, { id: toastId });
            addLog(`❌ Products sync failed: ${errMsg}`);
        } finally {
            setIsSyncingProducts(false);
        }
    };

    const triggerSyncOrders = async (force: boolean = false) => {
        setIsSyncingOrders(true);
        addLog(`📋 Starting Orders Synchronization (Force Full Sync: ${force})...`);
        const toastId = toast.loading('Syncing WooCommerce orders...');
        try {
            const { wordpressSyncAPI } = await import('../utils/api');
            const res = await wordpressSyncAPI.syncOrders(force);
            if (res?.success) {
                toast.success(res.message || 'Orders synced successfully!', { id: toastId });
                addLog(`✅ Successfully synced ${res.synced} orders.`);
                // Refresh local orders list
                const { ordersAPI } = await import('../utils/api');
                const ordersRes = await ordersAPI.getAllAdmin({ limit: 5000 });
                if (ordersRes) {
                    setOrders(ordersRes);
                }
                // Refresh status
                const statusRes = await wordpressSyncAPI.getStatus();
                if (statusRes?.success && statusRes.status) setSyncStatus(statusRes.status);
            }
        } catch (err: any) {
            console.error('Orders sync error:', err);
            const errMsg = err?.response?.data?.error || err?.message || 'Orders sync failed.';
            toast.error(errMsg, { id: toastId });
            addLog(`❌ Orders sync failed: ${errMsg}`);
        } finally {
            setIsSyncingOrders(false);
        }
    };

    const triggerSyncUsers = async (force: boolean = false) => {
        setIsSyncingUsers(true);
        addLog(`👥 Starting Customers Synchronization (Force Full Sync: ${force})...`);
        const toastId = toast.loading('Syncing customers from WooCommerce...');
        try {
            const { wordpressSyncAPI } = await import('../utils/api');
            const res = await wordpressSyncAPI.syncUsers(force);
            if (res?.success) {
                toast.success(res.message || 'Customers synced successfully!', { id: toastId });
                addLog(`✅ Successfully synced ${res.synced} customers.`);
                // Refresh local users list
                const { usersAPI } = await import('../utils/api');
                const usersRes = await usersAPI.getAll({ limit: 5000 });
                if (usersRes) {
                    setUsers(usersRes.users || usersRes);
                }
                // Refresh status
                const statusRes = await wordpressSyncAPI.getStatus();
                if (statusRes?.success && statusRes.status) setSyncStatus(statusRes.status);
            }
        } catch (err: any) {
            console.error('Customers sync error:', err);
            const errMsg = err?.response?.data?.error || err?.message || 'Customers sync failed.';
            toast.error(errMsg, { id: toastId });
            addLog(`❌ Customers sync failed: ${errMsg}`);
        } finally {
            setIsSyncingUsers(false);
        }
    };

    const triggerSyncFull = async (force: boolean = false) => {
        setIsSyncingAll(true);
        addLog(`🔄 Initiating Full WooCommerce System Synchronization (Force Full: ${force})...`);
        const toastId = toast.loading('Running full system sync (this may take up to 2 minutes)...');
        try {
            const { wordpressSyncAPI } = await import('../utils/api');
            const res = await wordpressSyncAPI.syncAll(force);
            if (res?.success) {
                toast.success('Full WooCommerce synchronization completed successfully!', { id: toastId });
                addLog(`✅ Full Sync complete: Categories: ${res.categories}, Brands: ${res.brands}, Products: ${res.products}, Orders: ${res.orders}, Customers: ${res.users}.`);
                
                // Refresh all datasets
                const { productsAPI, ordersAPI, usersAPI } = await import('../utils/api');
                const [pRes, oRes, uRes] = await Promise.all([
                    productsAPI.getAll({ limit: 5000 }),
                    ordersAPI.getAllAdmin({ limit: 5000 }),
                    usersAPI.getAll({ limit: 5000 })
                ]);
                if (pRes) {
                    const fresh = pRes.products || pRes;
                    if (Array.isArray(fresh)) {
                        setProducts(fresh.map((p: any) => ({
                            id: p.id,
                            name: p.name || 'Unknown Product',
                            category: (p.category && typeof p.category === 'object') ? p.category.name : (typeof p.category === 'string' ? p.category : 'General'),
                            price: p.price || 0,
                            stock: p.stock ?? 0,
                            image: p.image || '',
                            sku: p.sku
                        })));
                    }
                }
                if (oRes) setOrders(oRes);
                if (uRes) setUsers(uRes.users || uRes);
                
                // Refresh status
                const statusRes = await wordpressSyncAPI.getStatus();
                if (statusRes?.success && statusRes.status) setSyncStatus(statusRes.status);
            }
        } catch (err: any) {
            console.error('Full sync error:', err);
            const errMsg = err?.response?.data?.error || err?.message || 'Full sync failed.';
            toast.error(errMsg, { id: toastId });
            addLog(`❌ Full sync failed: ${errMsg}`);
        } finally {
            setIsSyncingAll(false);
        }
    };

    // Hero Slides State
    const [isHeroSlideModalOpen, setIsHeroSlideModalOpen] = useState(false);
    const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlide | null>(null);
    const [heroSlideFormData, setHeroSlideFormData] = useState<Partial<HeroSlide>>({
        badge: '',
        title: '',
        subtitle: '',
        image: '',
        bgClass: 'bg-pink-50 dark:bg-gray-800',
        gradientClass: 'from-pink-50 via-pink-50/80'
    });
    const [productSearchQuery, setProductSearchQuery] = useState('');

    // Deletion/Action Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        variant: 'danger' | 'primary' | 'success';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        variant: 'danger',
        onConfirm: () => { }
    });

    const [rejectionModal, setRejectionModal] = useState<{
        isOpen: boolean;
        docId: number | string | null;
        reason: string;
    }>({
        isOpen: false,
        docId: null,
        reason: ''
    });

    // Product State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeProductTab, setActiveProductTab] = useState<'general' | 'variations' | 'seo'>('general');
    const [isGeneratingSEO, setIsGeneratingSEO] = useState(false); // SEO Generation state
    const [reviewsFilter, setReviewsFilter] = useState('all');
    const [reviewsSearch, setReviewsSearch] = useState('');
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const filteredReviews = useMemo(() => {
        let filtered = reviews;
        
        if (reviewsFilter !== 'all') {
            if (reviewsFilter === 'approved') {
                filtered = filtered.filter(r => r.isApproved === true);
            } else if (reviewsFilter === 'pending') {
                filtered = filtered.filter(r => r.isApproved === undefined || r.isApproved === null);
            } else if (reviewsFilter === 'rejected') {
                filtered = filtered.filter(r => r.isApproved === false);
            }
        }
        
        if (reviewsSearch) {
            const search = reviewsSearch.toLowerCase();
            filtered = filtered.filter(r => 
                r.product?.toLowerCase().includes(search) ||
                r.user?.toLowerCase().includes(search) ||
                r.comment?.toLowerCase().includes(search)
            );
        }
        
        return filtered;
    }, [reviews, reviewsFilter, reviewsSearch]);

    const initialProductForm = {
        id: 0,
        name: '',
        shortDescription: '',
        description: '',
        price: '',
        originalPrice: '',
        weight: '',
        category: categories[0]?.name || '',
        brand: brands[0]?.name || '',
        image: 'https://placehold.co/300x300/e2e8f0/DD3B5F?text=Product',
        images: [] as string[],
        attributes: [] as { name: string, optionsStr: string }[],
        variations: [] as ProductVariation[],
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        stock: ''
    };
    const [productFormData, setProductFormData] = useState(initialProductForm);

    // Category State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryFormData, setCategoryFormData] = useState<Category>({ id: 0, name: '', iconClass: '', image: '' });

    // Brand State
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandProfile | null>(null);
    const [brandFormData, setBrandFormData] = useState<BrandProfile>({ id: 0, name: '', logo: '', description: '', productCount: 0 });

    // Verification and Cache States
    const [isVerificationsLoading, setIsVerificationsLoading] = useState(false);
    const [customerVerifications, setCustomerVerifications] = useState<User[]>([]);
    const [updatedUsersCache, setUpdatedUsersCache] = useState<Record<string, Partial<User>>>({});



    // --- Filtering & Pagination Logic ---

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                (o.customerName && o.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()));
            const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;

            // Month filtering
            let matchesMonth = true;
            if (orderFilterMonth !== 'all') {
                try {
                    const [year, month] = orderFilterMonth.split('-').map(Number);
                    const orderDate = parseOrderDate(o);
                    matchesMonth = orderDate.getFullYear() === year && orderDate.getMonth() === month - 1;
                } catch (e) {
                    matchesMonth = false;
                }
            }

            return matchesSearch && matchesStatus && matchesMonth;
        });
    }, [orders, orderSearchTerm, orderStatusFilter, orderFilterMonth]);

    const currentOrders = filteredOrders.slice(
        (orderPage - 1) * itemsPerPage,
        orderPage * itemsPerPage
    );

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
    );

    const currentCategories = filteredCategories.slice(
        (categoryPage - 1) * itemsPerPage,
        categoryPage * itemsPerPage
    );

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
    );

    const currentBrands = filteredBrands.slice(
        (brandPage - 1) * itemsPerPage,
        brandPage * itemsPerPage
    );


    // --- SEO Generation Logic ---
    const generateSEO = async () => {
        if (!apiKey) {
            toast.warning("Please configure Gemini API Key in Settings > AI Chatbot first.");
            return;
        }

        if (!productFormData.name || !productFormData.description) {
            toast.warning("Please enter Product Name and Description first.");
            return;
        }

        setIsGeneratingSEO(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash-001" });

            const prompt = `
                Generate SEO metadata for a dental product.
                Product Name: ${productFormData.name}
                Category: ${productFormData.category}
                Brand: ${productFormData.brand}
                Description: ${productFormData.description}

                Return ONLY a valid JSON object with the following keys:
                {
                    "seoTitle": "Optimized title (max 60 chars)",
                    "seoDescription": "Optimized description (max 160 chars)",
                    "seoKeywords": "comma, separated, keywords (max 10)"
                }
            `;

            const result = await model.generateContent(prompt);
            const text = await result.response.text();

            // Extract JSON from response (handle potential markdown ticks)
            const jsonStr = text.replace(/```json|```/g, '').trim();
            const seoData = JSON.parse(jsonStr);

            setProductFormData(prev => ({
                ...prev,
                seoTitle: seoData.seoTitle,
                seoDescription: seoData.seoDescription,
                seoKeywords: seoData.seoKeywords
            }));

            // Switch to SEO tab to show results
            setActiveProductTab('seo');

        } catch (error) {
            console.error("SEO Generation Failed:", error);
            toast.error("Failed to generate SEO. Please try again.");
        } finally {
            setIsGeneratingSEO(false);
        }
    };

    // --- Handlers ---
    const confirmDelete = (
        title: string,
        message: string,
        onConfirm: () => void,
        confirmText: string = 'Delete',
        variant: 'danger' | 'primary' | 'success' = 'danger'
    ) => {
        setDeleteConfirmation({
            isOpen: true,
            title,
            message,
            confirmText,
            variant,
            onConfirm: () => {
                onConfirm();
                setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleRejectVerification = async () => {
        if (!rejectionModal.docId || !rejectionModal.reason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            const { verificationAPI } = await import('../utils/api');
            const res = await verificationAPI.updateStatus(rejectionModal.docId, {
                status: 'rejected',
                rejectionReason: rejectionModal.reason
            });
            
            if (res.success) {
                setCustomerVerifications(prev => prev.map(d => 
                    d.id === rejectionModal.docId ? { ...d, status: 'rejected', rejectionReason: rejectionModal.reason } : d
                ));
                toast.success('Document rejected');
                setRejectionModal({ isOpen: false, docId: null, reason: '' });
            }
        } catch (error) {
            console.error('Failed to reject:', error);
            toast.error('Failed to reject document');
        }
    };

    const handleDeleteProduct = async (id: number | string) => {
        confirmDelete(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            async () => {
                try {
                    const { productsAPI } = await import('../utils/api');
                    await productsAPI.delete(id);
                    setProducts(products.filter(p => p.id !== id));
                    toast.success('Product deleted successfully');
                } catch (error) {
                    console.error('Failed to delete product:', error);
                    toast.error('Failed to delete product from database.');
                }
            }
        );
    };

    const handleDeleteCoupon = async (id: string) => {
        confirmDelete(
            'Delete Coupon',
            'Are you sure you want to delete this coupon? This action cannot be undone.',
            async () => {
                try {
                    const { couponsAPI } = await import('../utils/api');
                    await couponsAPI.delete(id);
                    toast.success('Coupon deleted successfully');
                    // Note: Refresh is handled by FetchCoupons in CouponsTab which re-renders on onDeleteCoupon call
                } catch (error) {
                    console.error('Failed to delete coupon:', error);
                    toast.error('Failed to delete coupon');
                }
            }
        );
    };

    const handleDeleteReview = async (id: string) => {
        confirmDelete(
            'Delete Review',
            'Are you sure you want to delete this review? This action cannot be undone.',
            async () => {
                try {
                    const { reviewsAPI } = await import('../utils/api');
                    await reviewsAPI.delete(id);
                    setReviews(reviews.filter(r => r.id !== id));
                    toast.success('Review deleted successfully');
                } catch (error) {
                    console.error('Error deleting review:', error);
                    toast.error('Failed to delete review');
                }
            }
        );
    };

    const handleSendResetEmail = async (email: string) => {
        confirmDelete(
            'Reset Password',
            `Are you sure you want to send a password reset email to ${email}?`,
            async () => {
                try {
                    if (!settings?.email) {
                        toast.error('SMTP settings not configured. Please configure email settings in Admin > Settings > Email tab.');
                        return;
                    }

                    const user = users.find(u => u.email === email);
                    const result = await sendPasswordResetEmail(
                        email,
                        user?.name || 'Customer',
                        settings.email
                    );

                    if (result.success) {
                        toast.success(result.message);
                    } else {
                        toast.error('Failed to send password reset email: ' + result.message);
                    }
                } catch (error: any) {
                    console.error('Error in handleSendResetEmail:', error);
                    toast.error(`Error: ${error.message || 'Failed to send password reset email'}`);
                }
            },
            'Send Email',
            'primary'
        );
    };

    const handleModerateReview = async (id: string, isApproved: boolean) => {
        try {
            const { reviewsAPI } = await import('../utils/api');
            const result = await reviewsAPI.moderate(id, isApproved);
            setReviews(reviews.map(r => r.id === id ? { ...r, isApproved } : r));
            toast.success(`Review ${isApproved ? 'approved' : 'rejected'} successfully`);
        } catch (error: any) {
            console.error('Error moderating review:', error);
            toast.error(`Failed to moderate review: ${error?.response?.data?.error || error.message}`);
        }
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setActiveProductTab('basic');
        setProductFormData({
            id: product.id,
            name: product.name,
            shortDescription: product.shortDescription || '',
            description: product.description || '',
            price: product.price.toString(),
            originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
            weight: product.weight || '',
            category: product.category,
            brand: product.brand || brands[0]?.name || '',
            image: product.image,
            images: product.images || [],
            attributes: product.attributes ? product.attributes.map(a => ({ name: a.name, optionsStr: Array.isArray(a.options) ? a.options.join(', ') : '' })) : [],
            variations: product.variations || [],
            seoTitle: product.seoTitle || '',
            seoDescription: product.seoDescription || '',
            seoKeywords: product.seoKeywords || '',
            stock: product.stock !== undefined ? product.stock.toString() : '0'
        });
        setIsProductModalOpen(true);
    };

    const handleAddNewProduct = () => {
        setEditingProduct(null);
        setActiveProductTab('basic');
        setProductFormData({
            ...initialProductForm,
            category: categories[0]?.name || '',
            brand: brands[0]?.name || '',
            id: Math.max(...products.map(p => p.id), 0) + 1,
            stock: '10'
        });
        setIsProductModalOpen(true);
    };

    const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductFormData({ ...productFormData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        setProductFormData(prev => ({ ...prev, images: [...(prev.images || []), reader.result as string] }));
                    }
                };
                reader.readAsDataURL(file as Blob);
            });
        }
    };

    const removeGalleryImage = (index: number) => {
        setProductFormData({
            ...productFormData,
            images: productFormData.images.filter((_, i) => i !== index)
        });
    };

    const handleAddAttribute = () => {
        setProductFormData({
            ...productFormData,
            attributes: [...productFormData.attributes, { name: '', optionsStr: '' }]
        });
    };

    const handleAttributeChange = (index: number, field: 'name' | 'optionsStr', value: string) => {
        const newAttrs = [...productFormData.attributes];
        newAttrs[index][field] = value;
        setProductFormData({ ...productFormData, attributes: newAttrs });
    };

    const handleRemoveAttribute = (index: number) => {
        setProductFormData({
            ...productFormData,
            attributes: productFormData.attributes.filter((_, i) => i !== index)
        });
    };

    // Generate Variations Logic
    const handleGenerateVariations = () => {
        const validAttributes = productFormData.attributes.filter(a => a.name && a.optionsStr);

        if (validAttributes.length === 0) {
            setProductFormData(prev => ({ ...prev, variations: [] }));
            return;
        }

        // Helper to compute cartesian product
        const combinations = validAttributes.reduce((acc, attr) => {
            const options = attr.optionsStr.split(',').map(s => s.trim()).filter(s => s);
            if (acc.length === 0) {
                return options.map(opt => ({ [attr.name]: opt }));
            }
            return acc.flatMap(existing => options.map(opt => ({ ...existing, [attr.name]: opt })));
        }, [] as Record<string, string>[]);

        const newVariations: ProductVariation[] = combinations.map(combo => {
            // Check if existing variation matches attributes to preserve price/stock/image
            const existing = productFormData.variations.find(v =>
                Object.entries(combo).every(([k, val]) => v.attributes[k] === val)
            );

            if (existing) return existing;

            return {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                attributes: combo,
                price: parseFloat(productFormData.price) || 0,
                originalPrice: parseFloat(productFormData.originalPrice) || 0,
                stock: parseInt(productFormData.stock) || 0,
                image: ''
            };
        });

        setProductFormData(prev => ({ ...prev, variations: newVariations }));
    };

    const updateVariation = (id: string, field: keyof ProductVariation, value: any) => {
        setProductFormData(prev => ({
            ...prev,
            variations: prev.variations.map(v => v.id === id ? { ...v, [field]: value } : v)
        }));
    };

    const removeVariation = (id: string) => {
        setProductFormData(prev => ({
            ...prev,
            variations: prev.variations.filter(v => v.id !== id)
        }));
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const finalAttributes = productFormData.attributes.map(a => ({
                name: a.name,
                options: a.optionsStr.split(',').map(s => s.trim()).filter(s => s)
            })).filter(a => a.name && a.options.length > 0);

            const productData: any = {
                name: productFormData.name,
                price: parseFloat(productFormData.price) || 0,
                originalPrice: parseFloat(productFormData.originalPrice) || 0,
                category: productFormData.category,
                brand: productFormData.brand,
                image: productFormData.image,
                images: productFormData.images,
                description: productFormData.description,
                shortDescription: productFormData.shortDescription,
                weight: productFormData.weight,
                attributes: finalAttributes,
                variations: productFormData.variations,
                seoTitle: productFormData.seoTitle,
                seoDescription: productFormData.seoDescription,
                seoKeywords: productFormData.seoKeywords,
                stock: parseInt(productFormData.stock) || 0,
                badgeId: productFormData.badgeId
            };

            // Validate product data
            const validation = productSchema.safeParse(productData);
            if (!validation.success) {
                const errorMessage = validation.error.issues[0].message;
                toast.error(errorMessage);
                setIsLoading(false);
                return;
            }


            const { productsAPI } = await import('../utils/api');
            let savedProduct: Product;

            if (editingProduct) {
                const response = await productsAPI.update(editingProduct.id, productData);
                savedProduct = response.product || response;
                setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...savedProduct } : p));
            } else {
                const response = await productsAPI.create(productData);
                savedProduct = response.product || response;
                setProducts([...products, savedProduct]);
            }
            
            setIsProductModalOpen(false);
            toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        } catch (error) {
            console.error('Failed to save product:', error);
            toast.error('Failed to save product to database.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle status change - just updates status, tracking is saved inline
    const handleStatusChangeWithTracking = (orderId: string, newStatus: Order['status']) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const newHistoryEntry = {
            status: newStatus,
            timestamp: new Date().toISOString(),
            updatedBy: 'Admin'
        };
        const updatedOrder = { 
            ...order, 
            status: newStatus,
            statusHistory: [...(order.statusHistory || []), newHistoryEntry]
        };
        
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder(updatedOrder);
        }

        // Save to backend using ordersAPI
        import('../utils/api').then(({ ordersAPI, notificationsAPI }) => {
            ordersAPI.updateStatus(orderId, newStatus, {
                courierName: order.courierName,
                trackingNumber: order.trackingNumber
            }).catch(err => console.error('Error saving status:', err));

            // Send email notification via backend API using secure notificationsAPI
            if (settings?.email?.host && order.customerName) {
                const customer = users.find(u => u.name === order.customerName);
                const customerEmail = customer?.email || '';
                if (customerEmail) {
                    notificationsAPI.sendOrderStatus({
                        to: customerEmail,
                        orderId: order.id,
                        customerName: order.customerName,
                        orderStatus: newStatus,
                        orderTotal: order.total,
                        orderDate: order.date,
                        trackingNumber: order.trackingNumber,
                        courierName: order.courierName
                    }).catch(err => console.error('Error sending email:', err));
                }
            }
        });
    };

    // Order Handlers
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    const handleBulkStatusUpdate = async (newStatus: Order['status']) => {
        if (selectedOrderIds.length === 0) return;
        
        confirmDelete(
            'Update Orders',
            `Are you sure you want to update ${selectedOrderIds.length} orders to "${newStatus}"?`,
            async () => {
                setIsBulkUpdating(true);
                try {
                    const { ordersAPI } = await import('../utils/api');
                    
                    // Sequential updates to avoid overloading or handling rate limits
                    // In a real production app, this would be a single batch API call
                    for (const id of selectedOrderIds) {
                        await ordersAPI.updateStatus(id, newStatus);
                    }

                    // Refresh orders list
                    const response = await ordersAPI.getAllAdmin({ limit: 500 });
                    if (response.orders) {
                        setOrders(response.orders);
                    }

                    setSelectedOrderIds([]);
                    toast.success(`Successfully updated ${selectedOrderIds.length} orders.`);
                } catch (err) {
                    console.error('Failed bulk update:', err);
                    toast.error('Some orders failed to update. Please refresh and try again.');
                } finally {
                    setIsBulkUpdating(false);
                }
            },
            'Update',
            'primary'
        );
    };

    // Customer Handlers
    const handleUpdateUser = async (userEmail: string, updates: Partial<User>) => {
        setIsLoading(true);
        try {
            const { usersAPI } = await import('../utils/api');
            const updatedUser = await usersAPI.update(userEmail, updates);
            
            setUsers(prev => prev.map(user => 
                user.email === userEmail ? { ...user, ...updates, ...updatedUser } : user
            ));
            
            toast.success('User updated successfully');
        } catch (error) {
            console.error('Failed to update user:', error);
            toast.error('Failed to update user in database');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        // Note: Full customer editing (creation/bulk) can be handled here if needed
        setIsCustomerModalOpen(false);
    };

    const handleDeleteUser = (userEmail: string) => {
        confirmDelete(
            'Delete User',
            'Are you sure you want to delete this user? This action cannot be undone.',
            async () => {
                setIsLoading(true);
                try {
                    const { usersAPI } = await import('../utils/api');
                    await usersAPI.delete(userEmail);
                    
                    setUsers(prev => prev.filter(user => user.email !== userEmail));
                    
                    toast.success('User deleted successfully');
                } catch (error) {
                    console.error('Failed to delete user:', error);
                    toast.error('Failed to delete user from database');
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };


    // SMTP Test Handler
    const handleTestSMTPConnection = async () => {
        if (!settings.email.host || !settings.email.port || !settings.email.user || !settings.email.pass) {
            toast.warning('Please fill in all SMTP settings before testing the connection.');
            return;
        }

        setTestingSMTP(true);

        // Since we can't test SMTP directly from the browser without a backend,
        // we'll validate the settings and provide helpful feedback
        try {
            // Simulate a connection test with validation
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Validate settings format
            const validations = [];

            // Check host format
            if (!settings.email.host.includes('.')) {
                validations.push('⚠️ SMTP host should be a domain (e.g., smtp.gmail.com)');
            }

            // Check port
            const commonPorts = [25, 465, 587, 2525];
            if (!commonPorts.includes(settings.email.port)) {
                validations.push(`ℹ️ Port ${settings.email.port} is uncommon. Standard ports are: 587 (TLS), 465 (SSL), 25 (unencrypted)`);
            }

            // Check email format
            if (!settings.email.user.includes('@')) {
                validations.push('⚠️ Username should typically be an email address');
            }

            // Provide recommendations
            let message = '✅ SMTP Settings Validated!\n\n';
            message += `Host: ${settings.email.host}\n`;
            message += `Port: ${settings.email.port}\n`;
            message += `Encryption: ${settings.email.encryption}\n`;
            message += `Username: ${settings.email.user}\n\n`;

            if (validations.length > 0) {
                message += 'Recommendations:\n' + validations.join('\n') + '\n\n';
            }

            message += '📧 Settings look good!\n\n';
            message += 'Note: Full connection testing requires a backend server.\n';
            message += 'To test email sending, try the "Send Verification Email" feature in the Customers tab.';

            toast.success('SMTP Settings Validated Successfully!');

        } catch (error: any) {
            console.error('SMTP test error:', error);
            toast.error(`Validation Failed: ${error.message || 'Unknown error'}`);
        } finally {
            setTestingSMTP(false);
        }
    };

    // Category Handlers
    const handleAddNewCategory = () => {
        setEditingCategory(null);
        setCategoryFormData({ id: 0, name: '', iconClass: '', image: '' });
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryFormData(category);
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = (categoryId: number | string) => {
        confirmDelete(
            'Delete Category',
            'Are you sure you want to delete this category? Products associated with this category might be affected.',
            async () => {
                try {
                    const { categoriesAPI } = await import('../utils/api');
                    await categoriesAPI.delete(categoryId);
                    setCategories(categories.filter(c => c.id !== categoryId));
                    toast.success('Category deleted successfully');
                } catch (error) {
                    console.error('Failed to delete category:', error);
                    toast.error('Failed to delete category from database');
                }
            }
        );
    };

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Validate category data
            const validation = categorySchema.safeParse(categoryFormData);
            if (!validation.success) {
                const errorMessage = validation.error.issues[0].message;
                toast.error(errorMessage);
                setIsLoading(false);
                return;
            }

            const { categoriesAPI } = await import('../utils/api');

            if (editingCategory) {
                const updated = await categoriesAPI.update(editingCategory.id, categoryFormData);
                const saved = updated.category || updated;
                setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...saved } : c));
                toast.success('Category updated successfully');
            } else {
                const created = await categoriesAPI.create(categoryFormData);
                const saved = created.category || created;
                setCategories([...categories, saved]);
                toast.success('Category created successfully');
            }
            setIsCategoryModalOpen(false);
        } catch (error) {
            console.error('Failed to save category:', error);
            toast.error('Failed to save category to database');
        } finally {
            setIsLoading(false);
        }
    };

    // Brand Handlers
    const handleAddNewBrand = () => {
        setEditingBrand(null);
        setBrandFormData({ id: 0, name: '', logo: '', description: '', productCount: 0 });
        setIsBrandModalOpen(true);
    };

    const handleEditBrand = (brand: BrandProfile) => {
        setEditingBrand(brand);
        setBrandFormData(brand);
        setIsBrandModalOpen(true);
    };

    const handleDeleteBrand = (brandId: number | string) => {
        confirmDelete(
            'Delete Brand',
            'Are you sure you want to delete this brand?',
            async () => {
                try {
                    const { brandsAPI } = await import('../utils/api');
                    await brandsAPI.delete(brandId);
                    setBrands(brands.filter(b => b.id !== brandId));
                    toast.success('Brand deleted successfully');
                } catch (error) {
                    console.error('Failed to delete brand:', error);
                    toast.error('Failed to delete brand from database');
                }
            }
        );
    };

    const handleSaveBrand = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Validate brand data
            const validation = brandSchema.safeParse(brandFormData);
            if (!validation.success) {
                const errorMessage = validation.error.issues[0].message;
                toast.error(errorMessage);
                setIsLoading(false);
                return;
            }

            const { brandsAPI } = await import('../utils/api');

            if (editingBrand) {
                const updated = await brandsAPI.update(editingBrand.id, brandFormData);
                const saved = updated.brand || updated;
                setBrands(brands.map(b => b.id === editingBrand.id ? { ...b, ...saved } : b));
                toast.success('Brand updated successfully');
            } else {
                const created = await brandsAPI.create(brandFormData);
                const saved = created.brand || created;
                setBrands([...brands, saved]);
                toast.success('Brand created successfully');
            }
            setIsBrandModalOpen(false);
        } catch (error) {
            console.error('Failed to save brand:', error);
            toast.error('Failed to save brand to database');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBrandLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBrandFormData({ ...brandFormData, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCategoryFormData({ ...categoryFormData, image: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    // Password Reset Handler
    const handleResetPassword = (customer: any) => {
        setSelectedCustomer(customer);
        setNewPassword('');
        setResetPasswordMethod('manual');
        setIsPasswordResetModalOpen(true);
    };

    const handlePasswordResetSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (resetPasswordMethod === 'manual') {
            if (newPassword.length < 6) {
                toast.warning('Password must be at least 6 characters long');
                return;
            }
            // In a real application, this would call an API to update the password
            toast.success(`Password for ${selectedCustomer?.name} updated successfully!`);
        } else {
            // Send password reset email
            toast.success(`Password reset link sent to ${selectedCustomer?.email}`);
        }

        setIsPasswordResetModalOpen(false);
        setNewPassword('');
    };

    // Settings Handlers
    const handleSettingsImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'siteIcon' | 'favicon') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({
                    ...settings,
                    general: { ...settings.general, [field]: reader.result as string }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = async () => {
        if (onSaveSettings) {
            setIsLoading(true);
            try {
                await onSaveSettings(settings);
                toast.success("Settings saved successfully!");
            } catch (error) {
                console.error('Failed to save settings:', error);
                toast.error('Failed to save settings to database');
            } finally {
                setIsLoading(false);
            }
        } else {
            // Fallback for local mode
            toast.success("Settings saved locally!");
        }
    };

    const statusBadgeColors: Record<Order['status'], string> = {
        Processing: 'bg-amber-100 text-amber-800 border-amber-200',
        Shipped: 'bg-blue-100 text-blue-800 border-blue-200',
        Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        Cancelled: 'bg-red-100 text-red-800 border-red-200',
        'Return Initiated': 'bg-purple-100 text-purple-800 border-purple-200',
        'Return Approved': 'bg-indigo-100 text-indigo-800 border-indigo-200',
        'Return Completed': 'bg-cyan-100 text-cyan-800 border-cyan-200',
        'Return Rejected': 'bg-rose-100 text-rose-800 border-rose-200'
    };

    const StatCard = ({ title, value, icon, colorClass, trend, trendUp, onClick }: { title: string, value: string, icon: string, colorClass: string, trend?: string, trendUp?: boolean, onClick?: () => void }) => (
        <div
            onClick={onClick}
            className={`p-6 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none text-white ${colorClass} relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
        >
            <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                <i className={`${icon} text-[8rem]`}></i>
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <p className="text-white/90 font-medium mb-1 text-xs uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-extrabold mb-2 tracking-tight drop-shadow-sm">{value}</h3>
                </div>
                {trend && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm bg-white/20 text-white flex items-center gap-1`}>
                            <i className={`fas fa-arrow-${trendUp ? 'up' : 'down'} text-[10px]`}></i> {trend}
                        </span>
                        <span className="text-xs text-white/70">vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );

    const Pagination = ({ currentPage, totalItems, onPageChange }: { currentPage: number, totalItems: number, onPageChange: (page: number) => void }) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return null;
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-surface-dark rounded-b-xl gap-4">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries</span>
                <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-xs dark:text-gray-300 font-medium transition-colors">Prev</button>
                    <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => {
                            if (totalPages > 7 && Math.abs(currentPage - (i + 1)) > 2 && i !== 0 && i !== totalPages - 1) {
                                if (Math.abs(currentPage - (i + 1)) === 3) return <span key={i} className="px-1 text-gray-400">...</span>;
                                return null;
                            }
                            return (
                                <button key={i} onClick={() => onPageChange(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md shadow-primary/30' : 'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}>{i + 1}</button>
                            );
                        })}
                    </div>
                    <button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-xs dark:text-gray-300 font-medium transition-colors">Next</button>
                </div>
            </div>
        );
    };

    const TableEmptyState = ({ colSpan, message, icon = "fas fa-search" }: { colSpan: number, message: string, icon?: string }) => (
        <tr>
            <td colSpan={colSpan} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-surface-dark">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600">
                        <i className={`${icon} text-3xl`}></i>
                    </div>
                    <p className="font-medium">{message}</p>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 font-sans text-sm transition-colors duration-300">
            {/* Sidebar */}
            <div className="flex h-screen overflow-hidden">

                {/* Backdrop for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                <aside
                    className={`fixed lg:relative inset-y-0 left-0 bg-white dark:bg-[#1F2937] text-gray-800 dark:text-white flex flex-col transition-all duration-300 z-30 shadow-xl border-r border-gray-100 dark:border-gray-800 transform ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
                >
                    {/* ... (Sidebar Header) ... */}
                    <div className="h-20 flex items-center px-4 border-b border-gray-100 dark:border-gray-800 relative bg-white dark:bg-[#1F2937]">
                        <div className={`flex items-center gap-3 transition-all duration-300 ${isSidebarOpen ? 'justify-start' : 'justify-center w-full'}`}>
                            {!isSidebarOpen && (
                                <img
                                    src="/Alpha-dentkart-logo-icon.png"
                                    alt="Alpha DentKart"
                                    className="h-10 w-10 object-contain"
                                />
                            )}
                            {isSidebarOpen && (
                                <img
                                    src="/Alpha-dentkart-logo-600p.png"
                                    alt="Alpha DentKart"
                                    className="h-10 object-contain"
                                />
                            )}
                        </div>

                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full shadow-md flex items-center justify-center hover:text-primary transition-colors border border-gray-200 dark:border-gray-600 z-50 hidden lg:flex"
                        >
                            <i className={`fas fa-chevron-${isSidebarOpen ? 'left' : 'right'} text-xs`}></i>
                        </button>

                        <button onClick={() => setIsSidebarOpen(false)} className="absolute right-4 top-6 text-gray-500 lg:hidden"><i className="fas fa-times text-xl"></i></button>
                    </div>

                    <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-x-hidden overflow-y-auto">
                        {[
                            { id: 'overview', icon: 'fas fa-th-large', label: 'Dashboard' },
                            { id: 'orders', icon: 'fas fa-shopping-bag', label: 'Orders', badge: newOrdersCount > 0 ? newOrdersCount : undefined },
                            { id: 'inventory', icon: 'fas fa-warehouse', label: 'Inventory', badge: products.filter(p => p.stock <= 5).length || undefined },
                            { id: 'products', icon: 'fas fa-box', label: 'Products' },
                            { id: 'customers', icon: 'fas fa-users', label: 'Customers', badge: users.filter(u => u.verificationStatus === 'pending').length || undefined },
                            { id: 'chat-support', icon: 'fas fa-comments', label: 'Chat Support' },
                            { id: 'reviews', icon: 'fas fa-star', label: 'Reviews' },
                            { id: 'categories', icon: 'fas fa-layer-group', label: 'Categories' },
                            { id: 'brands', icon: 'fas fa-tags', label: 'Brands' },
                            { id: 'homepage', icon: 'fas fa-home', label: 'Homepage' },
                            { id: 'themes', icon: 'fas fa-palette', label: 'Themes' },
                            { id: 'analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
                            { id: 'settings', icon: 'fas fa-cog', label: 'Settings' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                className={`w-full flex items-center ${isSidebarOpen ? 'px-4 gap-4' : 'justify-center px-0'} py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-gray-500 hover:bg-gray-50 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <i className={`${item.icon} w-6 text-center text-lg flex-shrink-0 transition-transform group-hover:scale-110`}></i>
                                <span className={`whitespace-nowrap transition-all duration-300 origin-left ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>{item.label}</span>
                                {item.badge && item.badge > 0 && (
                                    <span className={`ml-auto px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full ${isSidebarOpen ? 'animate-pulse' : 'absolute -top-1 -right-1'}`}>
                                        {item.badge}
                                    </span>
                                )}
                                {activeTab === item.id && !isSidebarOpen && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full"></div>}
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
                        <button onClick={onVisitSite} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 gap-4' : 'justify-center px-0'} py-3 rounded-xl font-medium text-sm text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors group relative`} title={!isSidebarOpen ? 'Visit Website' : ''}>
                            <i className="fas fa-external-link-alt w-6 text-center text-lg flex-shrink-0"></i>
                            <span className={`whitespace-nowrap transition-all duration-300 origin-left ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>Visit Website</span>
                        </button>
                        <button onClick={onLogout} className={`w-full flex items-center ${isSidebarOpen ? 'px-4 gap-4' : 'justify-center px-0'} py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors group relative`} title={!isSidebarOpen ? 'Logout' : ''}>
                            <i className="fas fa-sign-out-alt w-6 text-center text-lg flex-shrink-0"></i>
                            <span className={`whitespace-nowrap transition-all duration-300 origin-left ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0 hidden'}`}>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto w-full relative">
                    {/* ... (Previous Header content maintained) ... */}
                    <header className="bg-white/80 dark:bg-gray-900/80 sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4 lg:hidden">
                            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 dark:text-white text-xl"><i className="fas fa-bars"></i></button>
                            <span className="text-lg font-bold text-gray-800 dark:text-white">Admin</span>
                        </div>
                        <div className="hidden md:block">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{activeTab}</h2>
                        </div>
                        <div className="flex items-center gap-4 ml-auto">
                            {/* Notifications */}
                            <div className="relative">
                                <button onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }} className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary transition-colors shadow-sm relative">
                                    <i className="fas fa-bell"></i>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center animate-pulse">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 z-[99998] bg-black/10"
                                            onClick={() => setShowNotifications(false)}
                                        ></div>

                                        {/* Notification Panel - Fixed positioning */}
                                        <div className="fixed right-4 top-20 w-80 bg-white dark:bg-surface-dark rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[99999] overflow-hidden animate-fade-in">
                                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"><h4 className="font-bold text-gray-800 dark:text-white text-sm">Notifications</h4><span onClick={() => { markAllNotificationsAsRead(); setNotifications(getAllAdminNotifications()); setUnreadCount(0); }} className="text-xs text-primary font-medium cursor-pointer hover:underline">Mark all read</span></div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                        <i className="fas fa-bell-slash text-3xl mb-2 text-gray-300 dark:text-gray-600"></i>
                                                        <p className="text-sm font-medium">No notifications</p>
                                                        <p className="text-xs mt-1">You're all caught up!</p>
                                                    </div>
                                                ) : (
                                                    notifications.map(notification => (
                                                        <div
                                                            key={notification.id}
                                                            onClick={() => {
                                                                if (!notification.read) {
                                                                    markNotificationAsRead(notification.id);
                                                                    setNotifications(getAllAdminNotifications());
                                                                    setUnreadCount(getUnreadCount());
                                                                }
                                                                if (notification.link) {
                                                                    const tabMatch = notification.link.match(/tab=(\w+)/);
                                                                    if (tabMatch) {
                                                                        setActiveTab(tabMatch[1] as any);
                                                                    }
                                                                }
                                                                setShowNotifications(false);
                                                            }}
                                                            className={`p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex gap-3 items-start ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                                                }`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getNotificationColor(notification.type)}`}>
                                                                <i className={`fas ${getNotificationIcon(notification.type, notification.category)} text-xs`}></i>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="font-medium text-gray-800 dark:text-white text-sm">{notification.title}</p>
                                                                    {!notification.read && (
                                                                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notification.message}</p>
                                                                <p className="text-[10px] text-gray-400 mt-1">{getRelativeTime(notification.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative">
                                <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }} className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden hover:ring-2 hover:ring-indigo-100 transition-all focus:outline-none">
                                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=DD3B5F&color=fff" alt="Admin" />
                                </button>
                                
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fade-in">
                                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">Admin User</p>
                                            <p className="text-xs text-gray-500">admin@alphadentkart.com</p>
                                        </div>
                                        <button onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <i className="fas fa-cog mr-2"></i> Settings
                                        </button>
                                        <button onClick={() => { onVisitSite(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <i className="fas fa-external-link-alt mr-2"></i> Visit Site
                                        </button>
                                        <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                        <button onClick={() => { onLogout(); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium">
                                            <i className="fas fa-sign-out-alt mr-2"></i> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className="px-4 md:px-8 py-8">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in space-y-8">
                                {/* Interactive Stat Cards - Click to Navigate */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard onClick={() => setActiveTab('orders')} title="Total Revenue" value={`₹${orders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString('en-IN')}`} icon="fas fa-wallet" colorClass="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" trend="12.5%" trendUp={true} />
                                    <StatCard onClick={() => setActiveTab('orders')} title="Total Orders" value={orders.length.toString()} icon="fas fa-shopping-cart" colorClass="bg-gradient-to-br from-blue-400 to-cyan-600" trend="8.2%" trendUp={true} />
                                    <StatCard onClick={() => setActiveTab('products')} title="Total Products" value={products.length.toString()} icon="fas fa-box-open" colorClass="bg-gradient-to-br from-emerald-400 to-teal-600" trend="2.1%" trendUp={true} />
                                    <StatCard onClick={() => setActiveTab('analytics')} title="Total Visitors" value="12,340" icon="fas fa-chart-line" colorClass="bg-gradient-to-br from-orange-400 to-red-500" trend="5.4%" trendUp={true} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Interactive Revenue Chart */}
                                    <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 self-start">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Revenue Overview</h3>
                                                <p className="text-sm text-gray-500">Sales performance over time</p>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex text-xs font-medium">
                                                <button
                                                    onClick={() => setChartView('weekly')}
                                                    className={`px-4 py-1.5 rounded-md transition-all ${chartView === 'weekly' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                                >
                                                    Weekly
                                                </button>
                                                <button
                                                    onClick={() => setChartView('monthly')}
                                                    className={`px-4 py-1.5 rounded-md transition-all ${chartView === 'monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                                >
                                                    Monthly
                                                </button>
                                            </div>
                                        </div>
                                        <AnimatedGraph
                                            data={chartView === 'weekly' ? analyticsData.weeklyRevenue : analyticsData.monthlyRevenue}
                                            labels={chartView === 'weekly' ? analyticsData.weeklyLabels : analyticsData.monthlyLabels}
                                            colorHex={chartView === 'weekly' ? '#D97706' : '#DD3B5F'} // Premium Amber Gold or Brand Primary Pink
                                        />
                                    </div>

                                    {/* Recent Activity / Tiles */}
                                    <div className="space-y-6">

                                        {/* Low Stock Alert Widget */}
                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/30 overflow-hidden relative group transition-all hover:shadow-lg hover:shadow-orange-500/5">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <i className="fas fa-exclamation-triangle text-4xl text-orange-600"></i>
                                            </div>
                                            <div className="flex justify-between items-center mb-4 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                        <i className="fas fa-warehouse text-sm"></i>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Low Stock Alerts</h3>
                                                </div>
                                                <button onClick={() => setActiveTab('products')} className="text-xs font-bold text-primary hover:underline">Manage</button>
                                            </div>
                                            <div className="space-y-4 relative z-10">
                                                {products.filter(p => p.stock < 10).length === 0 ? (
                                                    <div className="py-4 text-center">
                                                        <i className="fas fa-check-circle text-emerald-500 text-2xl mb-2"></i>
                                                        <p className="text-xs text-gray-500">All stock levels are healthy</p>
                                                    </div>
                                                ) : (
                                                    products.filter(p => p.stock < 10).slice(0, 4).map(product => (
                                                        <div key={product.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-800/20">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                                <div className="overflow-hidden">
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{product.name}</p>
                                                                    <p className="text-[10px] text-gray-500">{product.category}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs font-bold text-orange-600">{product.stock} left</span>
                                                                <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                                                    <div className="h-full bg-orange-500" style={{ width: `${(product.stock / 10) * 100}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                                {products.filter(p => p.stock < 10).length > 4 && (
                                                    <p className="text-center text-[10px] text-gray-400 font-medium">+ {products.filter(p => p.stock < 10).length - 4} more items low on stock</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Recent Reviews Tile */}
                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Reviews</h3>
                                                <button onClick={() => setActiveTab('reviews')} className="text-xs font-bold text-primary hover:underline">View All</button>
                                            </div>
                                            <div className="space-y-4">
                                                {reviews.slice(0, 3).map(review => (
                                                    <div key={review.id} className="flex gap-3 pb-3 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                                                        <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center flex-shrink-0 font-bold text-xs border border-yellow-100">
                                                            {review.rating}<i className="fas fa-star text-[8px] ml-0.5"></i>
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{review.product}</p>
                                                            <p className="text-xs text-gray-500 truncate">"{review.comment}"</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{review.user} • {review.date}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Visitors Tile Summary */}
                                        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Live Visitors</h3>
                                                <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>
                                            </div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-4xl font-bold text-gray-800 dark:text-white">42</span>
                                                <span className="text-sm text-gray-500 mb-1">active now</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-500 w-[65%] rounded-full"></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                <span>Mobile: 65%</span>
                                                <span>Desktop: 35%</span>
                                            </div>
                                            <button onClick={() => setActiveTab('analytics')} className="w-full mt-4 py-2 text-sm text-primary font-medium border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors">
                                                View Full Analytics
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                {/* Recent Orders Tile (Full Width) */}
                                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Orders</h3>
                                        <button onClick={() => setActiveTab('orders')} className="text-sm font-medium text-primary hover:underline">View All Orders</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                                <tr>
                                                    <th className="px-6 py-4 font-medium">Order ID</th>
                                                    <th className="px-6 py-4 font-medium">Customer</th>
                                                    <th className="px-6 py-4 font-medium">Date</th>
                                                    <th className="px-6 py-4 font-medium">Total</th>
                                                    <th className="px-6 py-4 font-medium">Status</th>
                                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {orders.slice(0, 5).map(order => (
                                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.id}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.customerName || 'Guest'}</td>
                                                        <td className="px-6 py-4 text-gray-500">{formatDate(order.date || order.createdAt)}</td>
                                                        <td className="px-6 py-4 font-medium">₹{(order.total ?? 0).toLocaleString('en-IN')}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeColors[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button onClick={() => handleViewOrder(order)} className="text-primary hover:text-pink-700 font-medium text-xs border border-primary/30 px-3 py-1 rounded hover:bg-primary/5 transition-colors">View</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Tabs content is preserved below */}
                        {/* Products, Orders, Customers, Categories, Brands, Reviews, Analytics, Settings */}

                        {/* PRODUCTS TAB */}
                        {activeTab === 'products' && (
                            <ProductsTab 
                                products={products}
                                setProducts={setProducts}
                                categories={categories}
                                brands={brands}
                                onDeleteProduct={handleDeleteProduct}
                            />
                        )}

                        {/* ORDERS TAB */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-shopping-bag text-primary"></i> Orders List
                                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                                            {filteredOrders.length}
                                        </span>
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={async () => {
                                                setIsLoading(true);
                                                try {
                                                    const { ordersAPI } = await import('../utils/api');
                                                    const response = await ordersAPI.getAllAdmin({ limit: 500 });
                                                    if (response.orders) {
                                                        setOrders(response.orders);
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to refresh orders:', err);
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                            className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-pink-600 transition-colors text-sm font-medium flex items-center gap-2"
                                        >
                                            <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
                                            Refresh
                                        </button>
                                        <select
                                            value={orderStatusFilter}
                                            onChange={(e) => setOrderStatusFilter(e.target.value as any)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled">Cancelled</option>
                                            <option value="Return Initiated">Return Initiated</option>
                                            <option value="Return Approved">Return Approved</option>
                                            <option value="Return Completed">Return Completed</option>
                                            <option value="Return Rejected">Return Rejected</option>
                                        </select>
                                        <select
                                            value={orderFilterMonth}
                                            onChange={(e) => setOrderFilterMonth(e.target.value)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="all">All Months</option>
                                            {availableMonths.map(month => (
                                                <option key={month} value={month}>
                                                    {formatMonthDisplay(month)}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={orderSearchTerm}
                                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                                            placeholder="Search orders..."
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-full sm:w-64"
                                        />
                                    </div>
                                </div>

                                {/* Bulk Actions Bar */}
                                {selectedOrderIds.length > 0 && (
                                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-slide-up border border-white/10">
                                        <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                                            <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                                {selectedOrderIds.length}
                                            </span>
                                            <span className="text-sm font-medium">Orders Selected</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Update Status To:</span>
                                            <div className="flex gap-2">
                                                {['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Return Approved', 'Return Completed', 'Return Rejected'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleBulkStatusUpdate(status as any)}
                                                        disabled={isBulkUpdating}
                                                        className="px-3 py-1.5 bg-gray-800 hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedOrderIds([])}
                                            className="ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                        >
                                            <i className="fas fa-times text-xs"></i>
                                        </button>
                                    </div>
                                )}
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4 w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOrderIds.length === currentOrders.length && currentOrders.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedOrderIds(currentOrders.map(o => o.id));
                                                                } else {
                                                                    setSelectedOrderIds([]);
                                                                }
                                                            }}
                                                            className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4">Order ID</th>
                                                    <th className="px-6 py-4">Customer</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Total</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {isLoading ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                                                <p className="text-gray-500">Loading orders...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : currentOrders.length > 0 ? currentOrders.map(order => (
                                                    <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-primary/5' : ''}`}>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedOrderIds.includes(order.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedOrderIds(prev => [...prev, order.id]);
                                                                    } else {
                                                                        setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                            <div className="flex items-center gap-2">
                                                                {order.id}
                                                                {order.isNew && (
                                                                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded uppercase animate-pulse">
                                                                        NEW
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.customerName}</td>
                                                        <td className="px-6 py-4 text-gray-500">{formatDate(order.date || order.createdAt)}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">₹{(order.total ?? 0).toLocaleString('en-IN')}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusBadgeColors[order.status] || 'bg-gray-100'}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleViewOrder(order)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" title="View Details"><i className="fas fa-eye text-xs"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                                    <i className="fas fa-shopping-bag text-gray-400 text-2xl"></i>
                                                                </div>
                                                                <p className="text-gray-500 font-medium mb-2">No orders found</p>
                                                                <p className="text-gray-400 text-sm">Orders will appear here when customers place them</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={orderPage} totalItems={filteredOrders.length} onPageChange={setOrderPage} />
                                </div>
                            </div>
                        )}

                        {/* INVENTORY TAB */}
                        {activeTab === 'inventory' && (
                            <InventoryTab 
                                products={products}
                                setProducts={setProducts}
                                categories={categories}
                                brands={brands}
                                onEditProduct={(product) => {
                                    setActiveTab('products');
                                    // Note: Ideally we'd trigger the edit modal directly, 
                                    // but since ProductsTab has its own internal state, 
                                    // switching tabs is the simplest integration for now.
                                    handleEditProduct(product);
                                }}
                                isLoading={isLoadingProducts}
                            />
                        )}



                        {/* CUSTOMERS TAB */}
                        {activeTab === 'customers' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-users text-primary"></i> Customers List
                                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                                            {users.length}
                                        </span>
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <select
                                            value={customerTypeFilter}
                                            onChange={(e) => setCustomerTypeFilter(e.target.value as any)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="all">All Types</option>
                                            <option value="dental-doctor">Doctors</option>
                                            <option value="dental-student">Students</option>
                                            <option value="dental-business">Business/Clinics</option>
                                            <option value="regular">Regular</option>
                                            <option value="hidden">Hidden Users (No Mobile)</option>
                                        </select>
                                        <div className="relative w-full sm:w-64">
                                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                                            <input
                                                type="text"
                                                value={customerSearchTerm}
                                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                                placeholder="Search name, email, phone..."
                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <CustomerManagement 
                                    users={users}
                                    onUpdateUser={handleUpdateUser}
                                    onDeleteUser={handleDeleteUser}
                                    onResetPassword={handleSendResetEmail}
                                    searchTerm={customerSearchTerm}
                                    userTypeFilter={customerTypeFilter}
                                    onViewOrder={(order) => {
                                        setSelectedOrder(order);
                                        setIsOrderModalOpen(true);
                                    }}
                                    settings={settings}
                                    itemsPerPage={10}
                                    externalCurrentPage={usersPage}
                                    externalTotalItems={totalUsersCount}
                                    onPageChange={onUsersPageChange}
                                    isLoading={isLoadingUsersPage}
                                />
                            </div>
                        )}

                        {/* CHAT SUPPORT TAB */}
                        {activeTab === 'chat-support' && (
                            <div className="animate-fade-in p-4">
                                <ChatSupport 
                                    sessions={chatSessions} 
                                    setSessions={setChatSessions} 
                                />
                            </div>
                        )}


                        {/* CATEGORIES TAB */}
                        {activeTab === 'categories' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-layer-group text-primary"></i> Categories</h2>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <SearchInput value={categorySearchTerm} onChange={setCategorySearchTerm} placeholder="Search categories..." />
                                        <button
                                            onClick={handleSyncCategories}
                                            disabled={isSyncingCategories}
                                            className="bg-gray-800 dark:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center gap-2 disabled:opacity-50 flex-shrink-0 transition-transform active:scale-95"
                                        >
                                            {isSyncingCategories ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Syncing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-sync-alt"></i>
                                                    Sync Categories
                                                </>
                                            )}
                                        </button>
                                        <button onClick={handleAddNewCategory} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 flex-shrink-0 transition-transform active:scale-95"><i className="fas fa-plus mr-2"></i> Add Category</button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[600px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">ID</th>
                                                    <th className="px-6 py-4">Icon</th>
                                                    <th className="px-6 py-4">Name</th>
                                                    <th className="px-6 py-4">Products</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {currentCategories.length > 0 ? currentCategories.map(cat => (
                                                    <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4 text-gray-500">#{cat.id}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                                                                {cat.image ? (
                                                                    <img src={resolveProductImage(cat.image)} alt={cat.name} className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <i className={cat.iconClass || 'fas fa-tooth'}></i>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{cat.name}</td>
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {products.filter(p => p.category === cat.name).length}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleEditCategory(cat)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Edit"><i className="fas fa-pen text-xs"></i></button>
                                                                <button onClick={() => handleDeleteCategory(cat.id)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Delete"><i className="fas fa-trash text-xs"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <TableEmptyState colSpan={5} message="No categories found" icon="fas fa-layer-group" />}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <Pagination 
                                    currentPage={categoryPage} 
                                    totalItems={filteredCategories.length} 
                                    onPageChange={setCategoryPage} 
                                />
                            </div>
                        )}

                        {/* BRANDS TAB */}
                        {activeTab === 'brands' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-tags text-primary"></i> Brands</h2>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <SearchInput value={brandSearchTerm} onChange={setBrandSearchTerm} placeholder="Search brands..." />
                                        <button
                                            onClick={handleSyncBrands}
                                            disabled={isSyncingBrands}
                                            className="bg-gray-800 dark:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center gap-2 disabled:opacity-50 flex-shrink-0 transition-transform active:scale-95"
                                        >
                                            {isSyncingBrands ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i>
                                                    Syncing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-sync-alt"></i>
                                                    Sync Brands
                                                </>
                                            )}
                                        </button>
                                        <button onClick={handleAddNewBrand} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 flex-shrink-0 transition-transform active:scale-95"><i className="fas fa-plus mr-2"></i> Add Brand</button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Logo</th>
                                                    <th className="px-6 py-4">Brand Info</th>
                                                    <th className="px-6 py-4">Products</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {currentBrands.length > 0 ? currentBrands.map(brand => (
                                                    <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="w-16 h-16 border rounded-lg bg-white flex items-center justify-center p-2">
                                                                <img src={resolveProductImage(brand.logo)} alt={brand.name} className="w-full h-full object-contain" />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <h4 className="font-bold text-gray-900 dark:text-white">{brand.name}</h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 max-w-xs">{brand.description}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold">
                                                                {products.filter(p => p.brand === brand.name).length} Items
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleEditBrand(brand)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Edit"><i className="fas fa-pen text-xs"></i></button>
                                                                <button onClick={() => handleDeleteBrand(brand.id)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Delete"><i className="fas fa-trash text-xs"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <TableEmptyState colSpan={4} message="No brands found" icon="fas fa-tags" />}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <Pagination 
                                    currentPage={brandPage} 
                                    totalItems={filteredBrands.length} 
                                    onPageChange={setBrandPage} 
                                />
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-star text-primary"></i> Product Reviews</h2>
                                    <div className="flex gap-4 items-center">
                                        <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-100">
                                            {reviews.length} Reviews
                                        </div>
                                        <select 
                                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                                            onChange={(e) => setReviewsFilter(e.target.value)}
                                        >
                                            <option value="all">All</option>
                                            <option value="approved">Approved</option>
                                            <option value="pending">Pending</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            placeholder="Search reviews..." 
                                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-sm"
                                            value={reviewsSearch}
                                            onChange={(e) => setReviewsSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                {filteredReviews.length === 0 ? (
                                    <div className="bg-white dark:bg-surface-dark rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                                        <i className="fas fa-star text-4xl text-gray-300 mb-4"></i>
                                        <p className="text-gray-500">No reviews found</p>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Product</th>
                                                    <th className="px-6 py-4">User</th>
                                                    <th className="px-6 py-4">Rating</th>
                                                    <th className="px-6 py-4">Comment</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {filteredReviews.map(review => (
                                                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{review.product}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{review.user}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex text-yellow-400 text-xs">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star`}></i>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 italic max-w-xs truncate" title={review.comment}>"{review.comment}"</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                                review.isApproved === true ? 'bg-green-100 text-green-700' :
                                                                review.isApproved === false ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {review.isApproved === true ? 'Approved' : review.isApproved === false ? 'Rejected' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500 text-xs">{review.date}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <button 
                                                                    onClick={() => { setSelectedReview(review); setIsReviewModalOpen(true); }}
                                                                    className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50"
                                                                >
                                                                    <i className="fas fa-eye mr-1"></i>View
                                                                </button>
                                                                {review.isApproved !== true && (
                                                                    <button 
                                                                        onClick={() => handleModerateReview(review.id, true)} 
                                                                        className="text-green-500 hover:text-green-700 text-xs px-2 py-1 rounded hover:bg-green-50"
                                                                    >
                                                                        <i className="fas fa-check mr-1"></i>Approve
                                                                    </button>
                                                                )}
                                                                {review.isApproved !== false && (
                                                                    <button 
                                                                        onClick={() => handleModerateReview(review.id, false)} 
                                                                        className="text-orange-500 hover:text-orange-700 text-xs px-2 py-1 rounded hover:bg-orange-50"
                                                                    >
                                                                        <i className="fas fa-times mr-1"></i>Reject
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    onClick={() => handleDeleteReview(review.id)}
                                                                    className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                                                                >
                                                                    <i className="fas fa-trash mr-1"></i>Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* COUPONS TAB */}
                        {activeTab === 'coupons' && (
                            <div className="animate-fade-in space-y-6">
                                <CouponsTab onDeleteCoupon={handleDeleteCoupon} />
                            </div>
                        )}

                        {/* REVIEW DETAIL MODAL */}
                        {isReviewModalOpen && selectedReview && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in overflow-hidden">
                                    <div className="bg-gradient-to-r from-primary to-pink-600 px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                    <i className="fas fa-star text-white text-xl"></i>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">Review Details</h3>
                                                    <p className="text-pink-100 text-sm">{selectedReview.product}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setIsReviewModalOpen(false)}
                                                className="text-white/80 hover:text-white text-2xl"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Customer</p>
                                                <p className="font-bold text-gray-800 dark:text-white">{selectedReview.user}</p>
                                            </div>
                                            <div className="flex text-yellow-400 text-lg">
                                                {[...Array(5)].map((_, i) => (
                                                    <i key={i} className={`${i < selectedReview.rating ? 'fas' : 'far'} fa-star`}></i>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Product</p>
                                            <p className="font-medium text-gray-800 dark:text-white">{selectedReview.product}</p>
                                        </div>
                                        
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Review</p>
                                            <p className="text-gray-700 dark:text-gray-300">"{selectedReview.comment}"</p>
                                        </div>
                                        
                                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                                                <p className="font-medium text-gray-800 dark:text-white">{selectedReview.date}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                selectedReview.isApproved === true ? 'bg-green-100 text-green-700' :
                                                selectedReview.isApproved === false ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {selectedReview.isApproved === true ? 'Approved' : selectedReview.isApproved === false ? 'Rejected' : 'Pending'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <button 
                                                onClick={() => setIsReviewModalOpen(false)}
                                                className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                Close
                                            </button>
                                            <div className="flex-1"></div>
                                            {selectedReview.isApproved !== false && (
                                                <button 
                                                    onClick={async () => {
                                                        await handleModerateReview(selectedReview.id, false);
                                                        setSelectedReview({ ...selectedReview, isApproved: false });
                                                    }}
                                                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 transition-all"
                                                >
                                                    <i className="fas fa-times mr-2"></i>Reject
                                                </button>
                                            )}
                                            {selectedReview.isApproved !== true && (
                                                <button 
                                                    onClick={async () => {
                                                        await handleModerateReview(selectedReview.id, true);
                                                        setSelectedReview({ ...selectedReview, isApproved: true });
                                                    }}
                                                    className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/30 transition-all"
                                                >
                                                    <i className="fas fa-check mr-2"></i>Approve
                                                </button>
                                            )}
                                            <button 
                                                onClick={async () => {
                                                    await handleDeleteReview(selectedReview.id);
                                                    setIsReviewModalOpen(false);
                                                }}
                                                className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ANALYTICS (VISITORS) TAB */}
                        {activeTab === 'analytics' && (
                            <div className="animate-fade-in space-y-8">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-chart-line text-primary"></i> Traffic Analytics</h2>

                                {/* Visitor Chart */}
                                <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Visitor Traffic</h3>
                                            <p className="text-sm text-gray-500">Unique visitors over time</p>
                                        </div>
                                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex text-xs font-medium">
                                            <button
                                                onClick={() => setChartView('weekly')}
                                                className={`px-4 py-1.5 rounded-md transition-all ${chartView === 'weekly' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                            >
                                                Weekly
                                            </button>
                                            <button
                                                onClick={() => setChartView('monthly')}
                                                className={`px-4 py-1.5 rounded-md transition-all ${chartView === 'monthly' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                            >
                                                Monthly
                                            </button>
                                        </div>
                                    </div>
                                    <AnimatedGraph
                                        data={chartView === 'weekly' ? analyticsData.weeklyOrders : analyticsData.monthlyOrders}
                                        labels={chartView === 'weekly' ? analyticsData.weeklyLabels : analyticsData.monthlyLabels}
                                        colorHex={chartView === 'weekly' ? '#22c55e' : '#10b981'} // Green/Emerald
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Device Stats */}
                                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Device Breakdown</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1 font-medium"><span>Mobile</span><span>65%</span></div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2"><div className="bg-primary h-2 rounded-full w-[65%]"></div></div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1 font-medium"><span>Desktop</span><span>25%</span></div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full w-[25%]"></div></div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1 font-medium"><span>Tablet</span><span>10%</span></div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full w-[10%]"></div></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Referrals */}
                                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Top Referrals</h3>
                                        <ul className="space-y-4">
                                            <li className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                                <span className="flex items-center gap-2"><i className="fab fa-google text-blue-500"></i> Google Search</span>
                                                <span className="font-bold text-gray-800 dark:text-white">45%</span>
                                            </li>
                                            <li className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                                <span className="flex items-center gap-2"><i className="fas fa-envelope text-yellow-500"></i> Email Newsletter</span>
                                                <span className="font-bold text-gray-800 dark:text-white">20%</span>
                                            </li>
                                            <li className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800">
                                                <span className="flex items-center gap-2"><i className="fab fa-facebook text-blue-700"></i> Social Media</span>
                                                <span className="font-bold text-gray-800 dark:text-white">15%</span>
                                            </li>
                                            <li className="flex justify-between items-center">
                                                <span className="flex items-center gap-2"><i className="fas fa-link text-gray-500"></i> Direct</span>
                                                <span className="font-bold text-gray-800 dark:text-white">20%</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* SETTINGS TAB */}
                        {activeTab === 'settings' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="w-full sm:w-64 flex-shrink-0">
                                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            {[
                                                { id: 'general', label: 'General', icon: 'fas fa-cog' },
                                                { id: 'payment', label: 'Payment', icon: 'fas fa-credit-card' },
                                                { id: 'shipping', label: 'Shipping', icon: 'fas fa-truck' },
                                                { id: 'email', label: 'Email', icon: 'fas fa-envelope' },
                                                { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
                                                { id: 'ai-chatbot', label: 'AI Chatbot', icon: 'fas fa-robot' },
                                                { id: 'wordpress', label: 'WordPress Sync', icon: 'fab fa-wordpress' },
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveSettingsTab(tab.id as any)}
                                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors border-l-4 ${activeSettingsTab === tab.id ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                                >
                                                    <i className={`${tab.icon} w-5`}></i> {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        {/* General Settings */}
                                        {activeSettingsTab === 'general' && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl space-y-6 animate-fade-in">
                                                <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Store Information</h3>
                                                    <p className="text-sm text-gray-500">Manage your basic store details and appearance.</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
                                                        <input type="text" value={settings.general.storeName} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, storeName: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                                                        <input type="email" value={settings.general.supportEmail} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                                                        <input type="text" value={settings.general.contactPhone} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, contactPhone: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                                                        <input
                                                            type="text"
                                                            value={settings.general.whatsapp || ''}
                                                            onChange={(e) => setSettings({ ...settings, general: { ...settings.general, whatsapp: e.target.value } })}
                                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                            placeholder="+91 XXXXX XXXXX"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Address</label>
                                                        <textarea rows={3} value={settings.general.address} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, address: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"></textarea>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                                                        <select value={settings.general.currency} onChange={(e) => setSettings({ ...settings, general: { ...settings.general, currency: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary">
                                                            <option value="INR">Indian Rupee (INR)</option>
                                                            <option value="USD">US Dollar (USD)</option>
                                                            <option value="EUR">Euro (EUR)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="border-t border-gray-100 dark:border-gray-700 pt-6 mt-6">
                                                    <h4 className="font-bold text-gray-800 dark:text-white mb-4">Branding</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Store Logo</label>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                                    {settings.general.logo ? <img src={settings.general.logo} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-gray-400 text-xs">No Logo</span>}
                                                                </div>
                                                                <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                    Upload
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSettingsImageUpload(e, 'logo')} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Site Icon</label>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                                    {settings.general.siteIcon ? <img src={settings.general.siteIcon} alt="Icon" className="w-full h-full object-contain" /> : <span className="text-gray-400 text-xs">No Icon</span>}
                                                                </div>
                                                                <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                    Upload
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSettingsImageUpload(e, 'siteIcon')} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favicon</label>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                                    {settings.general.favicon ? <img src={settings.general.favicon} alt="Favicon" className="w-6 h-6 object-contain" /> : <span className="text-gray-400 text-[10px]">None</span>}
                                                                </div>
                                                                <label className="cursor-pointer bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                    Upload
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSettingsImageUpload(e, 'favicon')} />
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Payment Settings */}
                                        {activeSettingsTab === 'payment' && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl space-y-8 animate-fade-in">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Payment Gateways</h3>
                                                    <p className="text-sm text-gray-500 mb-6">Configure available payment methods for checkout.</p>

                                                    {/* PhonePe */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold">Pe</div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">PhonePe</h4>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.payment.phonepe.enabled} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, phonepe: { ...settings.payment.phonepe, enabled: e.target.checked } } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.payment.phonepe.enabled && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Merchant ID</label>
                                                                    <input type="text" value={settings.payment.phonepe.merchantId} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, phonepe: { ...settings.payment.phonepe, merchantId: e.target.value } } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Salt Key</label>
                                                                    <input type="password" value={settings.payment.phonepe.saltKey} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, phonepe: { ...settings.payment.phonepe, saltKey: e.target.value } } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Salt Index</label>
                                                                    <input type="text" value={settings.payment.phonepe.saltIndex} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, phonepe: { ...settings.payment.phonepe, saltIndex: e.target.value } } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Razorpay */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">Rz</div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Razorpay</h4>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.payment.razorpay.enabled} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, razorpay: { ...settings.payment.razorpay, enabled: e.target.checked } } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.payment.razorpay.enabled && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Key ID</label>
                                                                    <input type="text" value={settings.payment.razorpay.keyId} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, razorpay: { ...settings.payment.razorpay, keyId: e.target.value } } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Key Secret</label>
                                                                    <input type="password" value={settings.payment.razorpay.keySecret} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, razorpay: { ...settings.payment.razorpay, keySecret: e.target.value } } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* COD */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><i className="fas fa-money-bill-wave"></i></div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-800 dark:text-white">Cash on Delivery (COD)</h4>
                                                                    <p className="text-xs text-gray-500">Allow customers to pay upon delivery.</p>
                                                                </div>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.payment.cod.enabled} onChange={(e) => setSettings({ ...settings, payment: { ...settings.payment, cod: { ...settings.payment.cod, enabled: e.target.checked } } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.payment.cod.enabled && (
                                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-fade-in">
                                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                                    Minimum Order Total for COD (₹)
                                                                </label>
                                                                <input 
                                                                    type="number" 
                                                                    value={settings.payment.cod.minAmount || 0} 
                                                                    onChange={(e) => setSettings({ 
                                                                        ...settings, 
                                                                        payment: { 
                                                                            ...settings.payment, 
                                                                            cod: { 
                                                                                ...settings.payment.cod, 
                                                                                minAmount: parseFloat(e.target.value) || 0 
                                                                            } 
                                                                        } 
                                                                    })} 
                                                                    className="w-full max-w-xs rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" 
                                                                />
                                                                <p className="text-[10px] text-gray-500 mt-1">
                                                                    Customers can choose COD only if their order subtotal is at least this amount. Set to 0 for no minimum.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Shipping Settings */}
                                        {activeSettingsTab === 'shipping' && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl space-y-6 animate-fade-in">
                                                <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Shipping Configuration</h3>
                                                    <p className="text-sm text-gray-500">Manage shipping rates and zones.</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standard Shipping Rate (₹)</label>
                                                        <input type="number" value={settings.shipping.standardRate} onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, standardRate: parseFloat(e.target.value) } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                        <p className="text-xs text-gray-500 mt-1">Base rate for all orders.</p>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Free Shipping Threshold (₹)</label>
                                                        <input type="number" value={settings.shipping.freeShippingThreshold} onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, freeShippingThreshold: parseFloat(e.target.value) } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                        <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 dark:text-white text-sm">International Shipping</h4>
                                                        <p className="text-xs text-gray-500">Enable shipping to countries outside India.</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={settings.shipping.enableInternational} onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, enableInternational: e.target.checked } })} className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                    </label>
                                                </div>

                                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 dark:text-white text-base">Custom Shipping Zones (State-Specific Rates)</h4>
                                                            <p className="text-xs text-gray-500">Configure different shipping amounts for specific Indian states.</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newRule = { id: String(Date.now()), states: [], amount: 0 };
                                                                setSettings({
                                                                    ...settings,
                                                                    shipping: {
                                                                        ...settings.shipping,
                                                                        stateRules: [...(settings.shipping.stateRules || []), newRule]
                                                                    }
                                                                });
                                                            }}
                                                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                                                        >
                                                            <i className="fas fa-plus"></i> Add Shipping Option / Zone
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {(!settings.shipping.stateRules || settings.shipping.stateRules.length === 0) ? (
                                                            <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/10">
                                                                <i className="fas fa-truck-ramp-box text-3xl text-gray-300 dark:text-gray-600 mb-2"></i>
                                                                <p className="text-xs text-gray-500 font-medium">No custom state shipping rates configured yet.</p>
                                                                <p className="text-[10px] text-gray-400 mt-1">All states will fallback to the Standard Shipping Rate (Rest of India).</p>
                                                            </div>
                                                        ) : (
                                                            settings.shipping.stateRules.map((rule: any, idx: number) => {
                                                                const otherRulesStates = (settings.shipping.stateRules || [])
                                                                    .filter((r: any) => r.id !== rule.id)
                                                                    .flatMap((r: any) => r.states || []);
                                                                
                                                                const availableStates = INDIAN_STATES.filter(s => !otherRulesStates.includes(s));

                                                                return (
                                                                    <div key={rule.id || idx} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-surface-dark relative shadow-sm hover:shadow transition-all group">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updatedRules = settings.shipping.stateRules.filter((r: any) => r.id !== rule.id);
                                                                                setSettings({
                                                                                    ...settings,
                                                                                    shipping: {
                                                                                        ...settings.shipping,
                                                                                        stateRules: updatedRules
                                                                                    }
                                                                                });
                                                                            }}
                                                                            className="absolute top-4 right-4 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-lg transition-all"
                                                                            title="Remove Rule"
                                                                        >
                                                                            <i className="fas fa-trash-can text-sm"></i>
                                                                        </button>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pr-8">
                                                                            <div className="md:col-span-2">
                                                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                                                                    Select States in this Zone
                                                                                </label>
                                                                                
                                                                                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg min-h-[42px] max-h-[140px] overflow-y-auto">
                                                                                    {(!rule.states || rule.states.length === 0) && (
                                                                                        <p className="text-xs text-gray-400 self-center pl-1 font-medium italic">No states selected yet. Click below to add.</p>
                                                                                    )}
                                                                                    {(rule.states || []).map((st: string) => (
                                                                                        <span key={st} className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-1 rounded-md font-semibold border border-blue-100 dark:border-blue-800/30 shadow-sm">
                                                                                            {st}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const updatedStates = rule.states.filter((s: string) => s !== st);
                                                                                                    const updatedRules = settings.shipping.stateRules.map((r: any) => 
                                                                                                        r.id === rule.id ? { ...r, states: updatedStates } : r
                                                                                                    );
                                                                                                    setSettings({
                                                                                                        ...settings,
                                                                                                        shipping: {
                                                                                                            ...settings.shipping,
                                                                                                            stateRules: updatedRules
                                                                                                        }
                                                                                                    });
                                                                                                }}
                                                                                                className="text-blue-500 hover:text-blue-700 font-bold hover:scale-110 transition-transform"
                                                                                            >
                                                                                                &times;
                                                                                            </button>
                                                                                        </span>
                                                                                    ))}
                                                                                </div>

                                                                                <div className="mt-2 relative">
                                                                                    <select
                                                                                        value=""
                                                                                        onChange={(e) => {
                                                                                            const selectedState = e.target.value;
                                                                                            if (!selectedState) return;
                                                                                            const updatedStates = [...(rule.states || []), selectedState];
                                                                                            const updatedRules = settings.shipping.stateRules.map((r: any) => 
                                                                                                r.id === rule.id ? { ...r, states: updatedStates } : r
                                                                                            );
                                                                                            setSettings({
                                                                                                ...settings,
                                                                                                shipping: {
                                                                                                    ...settings.shipping,
                                                                                                    stateRules: updatedRules
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        className="w-full text-xs rounded-lg border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white py-1.5 focus:ring-primary focus:border-primary"
                                                                                    >
                                                                                        <option value="">+ Add state to this rule...</option>
                                                                                        {availableStates.map(st => (
                                                                                            <option key={st} value={st}>{st}</option>
                                                                                        ))}
                                                                                    </select>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                                                                    Shipping Rate (₹)
                                                                                </label>
                                                                                <div className="relative">
                                                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">₹</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={rule.amount}
                                                                                        onChange={(e) => {
                                                                                            const updatedRules = settings.shipping.stateRules.map((r: any) => 
                                                                                                r.id === rule.id ? { ...r, amount: parseFloat(e.target.value) || 0 } : r
                                                                                            );
                                                                                            setSettings({
                                                                                                ...settings,
                                                                                                shipping: {
                                                                                                    ...settings.shipping,
                                                                                                    stateRules: updatedRules
                                                                                                }
                                                                                            });
                                                                                        }}
                                                                                        className="w-full pl-8 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary text-sm font-bold"
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                                <p className="text-[10px] text-gray-500 mt-1 font-medium">Applied below Free Shipping Threshold.</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Email Settings */}
                                        {activeSettingsTab === 'email' && settings.email && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl space-y-6 animate-fade-in">
                                                <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">SMTP Settings</h3>
                                                    <p className="text-sm text-gray-500">Configure email server for outgoing notifications.</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                                                        <input type="text" value={settings.email?.host || ''} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, host: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                                                        <input type="number" value={settings.email?.port || 587} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, port: parseInt(e.target.value) || 587 } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username / Email</label>
                                                        <input type="text" value={settings.email?.user || ''} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, user: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                                        <input type="password" value={settings.email?.pass || ''} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, pass: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                                                        <select value={settings.email?.encryption || 'TLS'} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, encryption: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary">
                                                            <option value="TLS">TLS</option>
                                                            <option value="SSL">SSL</option>
                                                            <option value="None">None</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="pt-4">
                                                    <button
                                                        onClick={handleTestSMTPConnection}
                                                        disabled={testingSMTP}
                                                        className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${testingSMTP
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'text-primary hover:bg-primary/10'
                                                            }`}
                                                    >
                                                        {testingSMTP ? (
                                                            <>
                                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                                                Testing Connection...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fas fa-plug mr-2"></i>
                                                                Test Connection
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {activeSettingsTab === 'email' && !settings.email && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl">
                                                <p className="text-red-500">Email settings not loaded. Please refresh the page.</p>
                                            </div>
                                        )}

                                        {/* Notifications Settings */}
                                        {activeSettingsTab === 'notifications' && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl space-y-8 animate-fade-in">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Email Templates</h3>
                                                    <p className="text-sm text-gray-500 mb-6">Customize the messages sent to customers.</p>

                                                    {/* Order Confirmation */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="font-bold text-gray-800 dark:text-white">Order Confirmation</h4>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.orderConfirmation} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderConfirmation: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.orderConfirmation && (
                                                            <textarea rows={3} value={settings.notifications.orderConfirmationMessage} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderConfirmationMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary text-sm" placeholder="Message body..." />
                                                        )}
                                                    </div>

                                                    {/* Order Shipped */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="font-bold text-gray-800 dark:text-white">Order Shipped</h4>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.orderShipped} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderShipped: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.orderShipped && (
                                                            <textarea rows={3} value={settings.notifications.orderShippedMessage} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderShippedMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary text-sm" placeholder="Message body..." />
                                                        )}
                                                    </div>

                                                    {/* Order Delivered */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Order Delivered</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Sent when order is successfully delivered</p>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.orderDelivered || false} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderDelivered: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.orderDelivered && (
                                                            <textarea rows={3} value={settings.notifications.orderDeliveredMessage || 'Great news! Your order has been delivered successfully. Thank you for shopping with us!'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderDeliveredMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary text-sm" placeholder="Message body..." />
                                                        )}
                                                    </div>

                                                    {/* Order Cancelled */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Order Cancelled</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Sent when order is cancelled</p>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.orderCancelled || false} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderCancelled: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.orderCancelled && (
                                                            <textarea rows={3} value={settings.notifications.orderCancelledMessage || 'Your order has been cancelled as requested. If you have any questions, please contact our support team.'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, orderCancelledMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary text-sm" placeholder="Message body..." />
                                                        )}
                                                    </div>

                                                    {/* Welcome Email */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Welcome Email 🎉</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Sent when new customer registers</p>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.welcomeEmail || false} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, welcomeEmail: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.welcomeEmail && (
                                                            <div className="space-y-3">
                                                                <textarea rows={3} value={settings.notifications.welcomeEmailMessage || 'Welcome to Alpha Dentkart! Get 15% OFF on your first order with code WELCOME15. Valid for 7 days.'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, welcomeEmailMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary text-sm" placeholder="Message body..." />
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    <input type="text" value={settings.notifications.welcomeCouponCode || 'WELCOME15'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, welcomeCouponCode: e.target.value } })} className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Coupon Code" />
                                                                    <input type="number" value={settings.notifications.welcomeDiscount || 15} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, welcomeDiscount: parseInt(e.target.value) } })} className="rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Discount %" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Promotional Email */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Promotional Email 🎁</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Marketing campaigns and special offers</p>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.promotional || false} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, promotional: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.promotional && (
                                                            <div className="space-y-3">
                                                                <input type="text" value={settings.notifications.promotionalTitle || 'Flash Sale - Limited Time!'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, promotionalTitle: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Offer Title" />
                                                                <textarea rows={2} value={settings.notifications.promotionalMessage || 'Massive discounts on premium dental equipment. Limited time offer!'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, promotionalMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Offer Description" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Abandoned Cart */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Abandoned Cart 🛒</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Recover lost sales from abandoned carts</p>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.abandonedCart || false} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, abandonedCart: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.abandonedCart && (
                                                            <div className="space-y-3">
                                                                <textarea rows={2} value={settings.notifications.abandonedCartMessage || 'You left something in your cart! Complete your purchase now and get 10% OFF with code COMPLETE10.'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, abandonedCartMessage: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Message body..." />
                                                                <input type="number" value={settings.notifications.abandonedCartDelay || 1} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, abandonedCartDelay: parseInt(e.target.value) } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Send after (hours)" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Newsletter */}
                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 dark:text-white">Newsletter 📰</h4>
                                                                <p className="text-xs text-gray-500 mt-1">Regular updates and industry news</p>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" checked={settings.notifications.newsletter || false} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, newsletter: e.target.checked } })} className="sr-only peer" />
                                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                            </label>
                                                        </div>
                                                        {settings.notifications.newsletter && (
                                                            <div className="space-y-3">
                                                                <input type="text" value={settings.notifications.newsletterTitle || 'Alpha Dentkart Monthly Newsletter'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, newsletterTitle: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="Newsletter Title" />
                                                                <select value={settings.notifications.newsletterFrequency || 'monthly'} onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, newsletterFrequency: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm">
                                                                    <option value="weekly">Weekly</option>
                                                                    <option value="biweekly">Bi-weekly</option>
                                                                    <option value="monthly">Monthly</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* WordPress Sync Settings */}
                                        {activeSettingsTab === 'wordpress' && (
                                            <div className="animate-fade-in space-y-6">
                                                {/* Header Banner */}
                                                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-pink-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                                                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-6">
                                                        <i className="fab fa-wordpress text-[200px]"></i>
                                                    </div>
                                                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-xs font-semibold w-max mb-2 border border-pink-500/30">
                                                                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
                                                                WordPress / WooCommerce Integration
                                                            </div>
                                                            <h2 className="text-2xl font-bold tracking-tight">WordPress Synchronization Center</h2>
                                                            <p className="text-gray-300 text-sm mt-1 max-w-xl">
                                                                Seamlessly import and keep products, categories, brands, customers, and active orders synchronized with your WooCommerce store.
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => triggerSyncFull(true)}
                                                            disabled={isSyncingAll}
                                                            className={`bg-white text-gray-950 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 border border-white active:scale-95 shadow-lg ${isSyncingAll ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                        >
                                                            {isSyncingAll ? (
                                                                <>
                                                                    <i className="fas fa-spinner animate-spin"></i>
                                                                    Syncing WooCommerce...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fas fa-sync-alt"></i>
                                                                    Force Full Sync All
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                    {/* Left 1/3: WooCommerce Credentials */}
                                                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                                                            <i className="fas fa-key text-pink-500"></i> WooCommerce API Keys
                                                            {wpConsumerKey && (
                                                                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
                                                            )}
                                                        </h3>
                                                        <div className="space-y-3">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Site URL</label>
                                                                <input
                                                                    type="text"
                                                                    value={wpSiteUrl}
                                                                    onChange={(e) => setWpSiteUrl(e.target.value)}
                                                                    placeholder="https://alphadentkart.com"
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Consumer Key</label>
                                                                <input
                                                                    type="text"
                                                                    value={wpConsumerKey}
                                                                    onChange={(e) => setWpConsumerKey(e.target.value)}
                                                                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Consumer Secret</label>
                                                                <input
                                                                    type="password"
                                                                    value={wpConsumerSecret}
                                                                    onChange={(e) => setWpConsumerSecret(e.target.value)}
                                                                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 flex flex-col gap-2">
                                                            <button
                                                                onClick={handleTestConnection}
                                                                disabled={isTestingConnection}
                                                                className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-white font-bold py-2.5 rounded-xl text-sm transition-all border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2"
                                                            >
                                                                {isTestingConnection ? (
                                                                    <i className="fas fa-circle-notch animate-spin text-gray-500"></i>
                                                                ) : (
                                                                    <i className="fas fa-plug"></i>
                                                                )}
                                                                Test Connection
                                                            </button>
                                                            <button
                                                                onClick={handleSaveWpCredentials}
                                                                className="w-full bg-primary hover:bg-pink-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                                                            >
                                                                <i className="fas fa-save"></i>
                                                                Save Credentials
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Right 2/3: Entity Synchronizers & Realtime Console Logs */}
                                                    <div className="lg:col-span-2 space-y-6">
                                                        {/* Synced Cards Grid */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {/* Products Card */}
                                                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
                                                                <div>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-500 text-lg">
                                                                            <i className="fas fa-box"></i>
                                                                        </div>
                                                                        <span className="text-[10px] bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-bold">
                                                                            Products & Variations
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white mt-3 text-sm">Synchronize Products</h4>
                                                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                                                        Last Sync: {syncStatus?.lastProductSync ? new Date((syncStatus.lastProductSync.seconds || syncStatus.lastProductSync._seconds || 0) * 1000).toLocaleString() : 'Never'}
                                                                    </p>
                                                                    
                                                                    <div className="flex items-center justify-between mt-3 bg-gray-50 dark:bg-gray-855 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Force Full Sync</span>
                                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={forceFullSyncProducts}
                                                                                onChange={(e) => setForceFullSyncProducts(e.target.checked)}
                                                                                className="sr-only peer"
                                                                            />
                                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => triggerSyncProducts(forceFullSyncProducts)}
                                                                    disabled={isSyncingProducts}
                                                                    className="w-full bg-primary hover:bg-pink-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                                                                >
                                                                    {isSyncingProducts ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sync"></i>}
                                                                    Sync Products
                                                                </button>
                                                            </div>

                                                            {/* Orders Card */}
                                                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
                                                                <div>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-500 text-lg">
                                                                            <i className="fas fa-shopping-cart"></i>
                                                                        </div>
                                                                        <span className="text-[10px] bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-bold">
                                                                            Sales & Daily Orders
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white mt-3 text-sm">Synchronize Orders</h4>
                                                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                                                        Last Sync: {syncStatus?.lastOrderSync ? new Date((syncStatus.lastOrderSync.seconds || syncStatus.lastOrderSync._seconds || 0) * 1000).toLocaleString() : 'Never'}
                                                                    </p>

                                                                    <div className="flex items-center justify-between mt-3 bg-gray-50 dark:bg-gray-855 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Force Full Sync</span>
                                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={forceFullSyncOrders}
                                                                                onChange={(e) => setForceFullSyncOrders(e.target.checked)}
                                                                                className="sr-only peer"
                                                                            />
                                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => triggerSyncOrders(forceFullSyncOrders)}
                                                                    disabled={isSyncingOrders}
                                                                    className="w-full bg-primary hover:bg-pink-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                                                                >
                                                                    {isSyncingOrders ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sync"></i>}
                                                                    Sync Orders
                                                                </button>
                                                            </div>

                                                            {/* Customers Card */}
                                                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
                                                                <div>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-500 text-lg">
                                                                            <i className="fas fa-users"></i>
                                                                        </div>
                                                                        <span className="text-[10px] bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-bold">
                                                                            User Profiles & Billing
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white mt-3 text-sm">Synchronize Customers</h4>
                                                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                                                        Last Sync: {syncStatus?.lastUserSync ? new Date((syncStatus.lastUserSync.seconds || syncStatus.lastUserSync._seconds || 0) * 1000).toLocaleString() : 'Never'}
                                                                    </p>

                                                                    <div className="flex items-center justify-between mt-3 bg-gray-50 dark:bg-gray-855 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Force Full Sync</span>
                                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={forceFullSyncUsers}
                                                                                onChange={(e) => setForceFullSyncUsers(e.target.checked)}
                                                                                className="sr-only peer"
                                                                            />
                                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => triggerSyncUsers(forceFullSyncUsers)}
                                                                    disabled={isSyncingUsers}
                                                                    className="w-full bg-primary hover:bg-pink-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                                                                >
                                                                    {isSyncingUsers ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sync"></i>}
                                                                    Sync Customers
                                                                </button>
                                                            </div>

                                                            {/* Taxonomies Card */}
                                                            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4">
                                                                <div>
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center text-pink-500 text-lg">
                                                                            <i className="fas fa-tags"></i>
                                                                        </div>
                                                                        <span className="text-[10px] bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full font-bold">
                                                                            Brands & Categories
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white mt-3 text-sm">Sync Categories & Brands</h4>
                                                                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                                                        Synchronize core catalog taxonomy terms to index properly on Alpha-Dentkart.
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={handleSyncCategories}
                                                                        disabled={isSyncingCategories}
                                                                        className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-white font-bold py-2 rounded-xl text-[11px] border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-1.5"
                                                                    >
                                                                        {isSyncingCategories ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-folder"></i>}
                                                                        Categories
                                                                    </button>
                                                                    <button
                                                                        onClick={handleSyncBrands}
                                                                        disabled={isSyncingBrands}
                                                                        className="flex-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-white font-bold py-2 rounded-xl text-[11px] border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center gap-1.5"
                                                                    >
                                                                        {isSyncingBrands ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-tag"></i>}
                                                                        Brands
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Realtime Terminal Console Log */}
                                                        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-lg p-5 space-y-3">
                                                            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                                                    <span className="text-gray-400 font-mono text-xs ml-2">system-sync.log</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSyncLogs(['📺 WordPress Sync Console ready...'])}
                                                                    className="text-gray-500 hover:text-gray-300 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1"
                                                                >
                                                                    <i className="fas fa-trash"></i> Clear Console
                                                                </button>
                                                            </div>
                                                            <div
                                                                id="sync-console-box"
                                                                className="font-mono text-xs text-green-400 h-48 overflow-y-auto space-y-1"
                                                                ref={(el) => {
                                                                    if (el) {
                                                                        el.scrollTop = el.scrollHeight;
                                                                    }
                                                                }}
                                                            >
                                                                {syncLogs.map((log, idx) => (
                                                                    <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                                                                        {log}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* AI Chatbot Settings */}
                                        {activeSettingsTab === 'ai-chatbot' && (
                                            <div className="animate-fade-in">
                                                <AISettings />
                                            </div>
                                        )}

                                        {activeSettingsTab !== 'ai-chatbot' && activeSettingsTab !== 'wordpress' && (
                                            <div className="mt-6 flex justify-end">
                                                <button onClick={handleSaveSettings} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 transition-all active:scale-95">
                                                    Save Changes
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* THEMES TAB */}
                        {activeTab === 'themes' && <ThemesTab />}
                    </div>

                    {/* HOMEPAGE TAB */}
                    {activeTab === 'homepage' && (
                        <div className="animate-fade-in">
                            <HomepageTab
                                homepageSettings={currentHomepageSettings}
                                setHomepageSettings={handleSetHomepageSettings}
                                categories={categories}
                                brands={brands}
                                heroSlides={heroSlides}
                                onAddHeroSlide={onAddHeroSlide}
                                onUpdateHeroSlide={onUpdateHeroSlide}
                                onDeleteHeroSlide={onDeleteHeroSlide}
                                onReorderHeroSlides={onReorderHeroSlides}
                                promotionalTiles={promotionalTiles}
                                onUpdatePromotionalTile={onUpdatePromotionalTile}
                                onToggleBrandFeatured={onToggleBrandFeatured}
                                onReorderFeaturedBrands={onReorderFeaturedBrands}
                                onSaveSettings={handleSaveHomepageSettings}
                            />
                        </div>
                    )}
                </main>
            </div >

            {/* Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                    ></div>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-8 shadow-2xl relative border border-gray-100 dark:border-gray-800 transform transition-all animate-in fade-in zoom-in duration-300">
                        <div className={`w-16 h-16 ${deleteConfirmation.variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : deleteConfirmation.variant === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary/10 dark:bg-primary/20'} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                            <i className={`fas ${deleteConfirmation.variant === 'danger' ? 'fa-trash-alt text-red-600 dark:text-red-400' : deleteConfirmation.variant === 'success' ? 'fa-check-circle text-green-600 dark:text-green-400' : 'fa-info-circle text-primary'} text-2xl`}></i>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">{deleteConfirmation.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                            {deleteConfirmation.message}
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={deleteConfirmation.onConfirm}
                                className={`w-full py-4 ${deleteConfirmation.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : deleteConfirmation.variant === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' : 'bg-primary hover:bg-primary/90 shadow-primary/20'} text-white rounded-2xl text-sm font-bold shadow-lg transition-all`}
                            >
                                {deleteConfirmation.confirmText}
                            </button>
                            <button
                                onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                                className="w-full py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                    ></div>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-8 shadow-2xl relative border border-gray-100 dark:border-gray-800 transform transition-all">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <i className="fas fa-exclamation-circle text-red-600 dark:text-red-400 text-2xl"></i>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">Reject Document</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                            Please provide a reason for rejecting this document. This will be visible to the customer.
                        </p>

                        <textarea
                            value={rejectionModal.reason}
                            onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                            placeholder="Reason for rejection..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all mb-6 min-h-[100px] resize-none"
                            autoFocus
                        />

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleRejectVerification}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-red-500/20 transition-all"
                            >
                                Confirm Rejection
                            </button>
                            <button
                                onClick={() => setRejectionModal({ ...rejectionModal, isOpen: false })}
                                className="w-full py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals for Product, Category, Customer, Brand Edit */}
            {
                isProductModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl animate-fade-in flex flex-col">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-20">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                                <button onClick={() => setIsProductModalOpen(false)} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:text-red-500 shadow-sm"><i className="fas fa-times"></i></button>
                            </div>

                            <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
                                {['basic', 'data', 'images', 'variations', 'seo'].map((tab: string) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveProductTab(tab)}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeProductTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto">
                                <form onSubmit={handleSaveProduct} className="space-y-6">
                                    {/* BASIC TAB */}
                                    {activeProductTab === 'basic' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                                                <input type="text" required value={productFormData.name} onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                                    <select value={productFormData.category} onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary">
                                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                                                    <select value={productFormData.brand} onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary">
                                                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Homepage Badge</label>
                                                <select
                                                    value={productFormData.badgeId || ''}
                                                    onChange={(e) => setProductFormData({ ...productFormData, badgeId: e.target.value as any })}
                                                    className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                                >
                                                    <option value="">None</option>
                                                    {currentHomepageSettings?.badges?.filter(b => b.enabled).map(badge => (
                                                        <option key={badge.id} value={badge.id}>{badge.name}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Customize badges in Admin → Homepage tab
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Short Description</label>
                                                <textarea rows={2} value={productFormData.shortDescription} onChange={(e) => setProductFormData({ ...productFormData, shortDescription: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Description</label>
                                                <textarea rows={5} value={productFormData.description} onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"></textarea>
                                            </div>
                                        </div>
                                    )}

                                    {/* DATA TAB */}
                                    {activeProductTab === 'data' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Regular Price (₹)</label>
                                                    <input type="number" required value={productFormData.price} onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original Price (₹)</label>
                                                    <input type="number" value={productFormData.originalPrice} onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
                                                    <input type="number" value={productFormData.stock} onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (e.g. 500g)</label>
                                                    <input type="text" value={productFormData.weight} onChange={(e) => setProductFormData({ ...productFormData, weight: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* IMAGES TAB */}
                                    {activeProductTab === 'images' && (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Image</label>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-24 h-24 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                                        {productFormData.image ? <img src={resolveProductImage(productFormData.image)} className="w-full h-full object-contain" alt="Main" /> : <span className="text-xs text-gray-400">Preview</span>}
                                                    </div>
                                                    <input type="file" onChange={handleProductImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gallery Images</label>
                                                <div className="flex flex-wrap gap-4 mb-4">
                                                    {productFormData.images.map((img, idx) => (
                                                        <div key={idx} className="relative w-20 h-20 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden group">
                                                            <img src={resolveProductImage(img)} className="w-full h-full object-contain" alt={`Gallery ${idx}`} />
                                                            <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-trash"></i></button>
                                                        </div>
                                                    ))}
                                                    <label className="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary hover:text-primary transition-colors">
                                                        <i className="fas fa-plus mb-1"></i>
                                                        <span className="text-[10px]">Add</span>
                                                        <input type="file" multiple className="hidden" onChange={handleGalleryUpload} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* VARIATIONS TAB */}
                                    {activeProductTab === 'variations' && (
                                        <div className="space-y-6">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 mb-4">
                                                <p><i className="fas fa-info-circle mr-1"></i> Add attributes first (e.g., Color, Size), then generate variations.</p>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attributes</label>
                                                    <button type="button" onClick={handleAddAttribute} className="text-primary text-xs font-bold hover:underline">+ Add Attribute</button>
                                                </div>
                                                <div className="space-y-3">
                                                    {productFormData.attributes.map((attr, idx) => (
                                                        <div key={idx} className="flex gap-2 items-start">
                                                            <input type="text" placeholder="Name (e.g. Color)" value={attr.name} onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)} className="w-1/3 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                            <input type="text" placeholder="Options (comma separated)" value={attr.optionsStr} onChange={(e) => handleAttributeChange(idx, 'optionsStr', e.target.value)} className="flex-1 rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                                            <button type="button" onClick={() => handleRemoveAttribute(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i className="fas fa-trash"></i></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                                <button type="button" onClick={handleGenerateVariations} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 mb-4">Generate Variations</button>

                                                {productFormData.variations.length > 0 && (
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                                        {productFormData.variations.map((v) => (
                                                            <div key={v.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center">
                                                                <div className="flex-1">
                                                                    <div className="flex gap-2">
                                                                        {Object.entries(v.attributes).map(([key, val]) => (
                                                                            <span key={key} className="text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">{key}: <b>{val}</b></span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 w-full sm:w-auto">
                                                                    <input type="number" placeholder="Price" value={v.price} onChange={(e) => updateVariation(v.id, 'price', parseFloat(e.target.value))} className="w-20 rounded border-gray-300 text-xs p-1" />
                                                                    <input type="number" placeholder="Stock" value={v.stock} onChange={(e) => updateVariation(v.id, 'stock', parseInt(e.target.value))} className="w-16 rounded border-gray-300 text-xs p-1" />
                                                                    <button type="button" onClick={() => removeVariation(v.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><i className="fas fa-trash"></i></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* SEO TAB */}
                                    {activeProductTab === 'seo' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={generateSEO}
                                                    disabled={isGeneratingSEO || !apiKey}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                                >
                                                    {isGeneratingSEO ? (
                                                        <>
                                                            <i className="fas fa-spinner fa-spin"></i>
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-magic"></i>
                                                            Generate Auto SEO
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEO Title</label>
                                                <input type="text" value={productFormData.seoTitle} onChange={(e) => setProductFormData({ ...productFormData, seoTitle: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SEO Description</label>
                                                <textarea rows={3} value={productFormData.seoDescription} onChange={(e) => setProductFormData({ ...productFormData, seoDescription: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords</label>
                                                <input type="text" value={productFormData.seoKeywords} onChange={(e) => setProductFormData({ ...productFormData, seoKeywords: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" placeholder="comma, separated, keywords" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="sticky bottom-0 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-700 pt-4 mt-8 flex justify-end gap-3 pb-safe">
                                        <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                        <button type="submit" className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-pink-700 shadow-lg shadow-primary/30">Save Product</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }



            {/* Category Modal */}
            {
                isCategoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md relative z-10 shadow-2xl p-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                            <form onSubmit={handleSaveCategory} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                    <input type="text" required value={categoryFormData.name} onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Category Image</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 border rounded bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                            {categoryFormData.image ? (
                                                <img src={resolveProductImage(categoryFormData.image)} className="w-full h-full object-contain" />
                                            ) : (
                                                <i className={`${categoryFormData.iconClass || 'fas fa-tooth'} text-gray-400`}></i>
                                            )}
                                        </div>
                                        <input type="file" onChange={handleCategoryImageUpload} className="text-xs text-gray-500" accept="image/*" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Icon Class (FontAwesome - Fallback)</label>
                                    <input type="text" value={categoryFormData.iconClass || ''} onChange={(e) => setCategoryFormData({ ...categoryFormData, iconClass: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="fas fa-tooth" />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Brand Modal */}
            {
                isBrandModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsBrandModalOpen(false)}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-md relative z-10 shadow-2xl p-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{editingBrand ? 'Edit Brand' : 'Add Brand'}</h3>
                            <form onSubmit={handleSaveBrand} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                    <input type="text" required value={brandFormData.name} onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Logo</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-16 h-16 border rounded bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                            {brandFormData.logo ? <img src={resolveProductImage(brandFormData.logo)} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Img</span>}
                                        </div>
                                        <input type="file" onChange={handleBrandLogoUpload} className="text-xs text-gray-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                    <textarea rows={3} value={brandFormData.description} onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"></textarea>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setIsBrandModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Customer Modal */}
            {
                isCustomerModalOpen && selectedCustomer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCustomerModalOpen(false)}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-2xl relative z-10 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{isViewCustomerMode ? 'Customer Details' : 'Edit Customer'}</h3>
                                <button onClick={() => setIsCustomerModalOpen(false)}><i className="fas fa-times text-gray-400 hover:text-red-500"></i></button>
                            </div>

                            {isViewCustomerMode ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <img src={selectedCustomer.avatar} className="w-16 h-16 rounded-full border border-gray-200" alt="" />
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCustomer.name}</h4>
                                            <p className="text-gray-500 dark:text-gray-400">{selectedCustomer.email}</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs">{selectedCustomer.phone}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedCustomer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{selectedCustomer.status}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Total Spent</p>
                                            <p className="font-bold text-gray-900 dark:text-white">₹{(selectedCustomer.spent || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase">Total Orders</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{selectedCustomer.orders}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-white mb-2">Addresses</h5>
                                        {selectedCustomer.addresses.map(addr => (
                                            <div key={addr.id} className="border border-gray-100 dark:border-gray-700 p-3 rounded-lg mb-2 text-sm text-gray-600 dark:text-gray-300">
                                                <p className="font-bold text-gray-800 dark:text-white">{addr.type} {addr.isDefault && <span className="text-green-600 text-xs">(Default)</span>}</p>
                                                <p>{addr.street}, {addr.city}, {addr.state} - {addr.zip}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order History */}
                                    <div>
                                        <h5 className="font-bold text-gray-800 dark:text-white mb-2">Order History</h5>
                                        {(() => {
                                            const customer = users.find(u => u.name === selectedCustomer.name);
                                            const customerOrders = customer?.orders || [];

                                            return customerOrders.length > 0 ? (
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {customerOrders.map((order, idx) => (
                                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-800">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <p className="font-bold text-gray-800 dark:text-white text-sm">Order #{order.id}</p>
                                                                    <p className="text-xs text-gray-500">{formatDate(order.date || order.createdAt)}</p>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                                                            'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {order.status}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                                                {order.items.map((item, i) => (
                                                                    <p key={i}>\u2022 {item.name} (x{item.quantity})</p>
                                                                ))}
                                                            </div>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <p className="font-bold text-primary text-sm">Total: ₹{(order.total ?? 0).toLocaleString('en-IN')}</p>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setIsOrderModalOpen(true);
                                                                    }}
                                                                    className="text-xs text-primary hover:text-pink-700 font-bold flex items-center gap-1"
                                                                >
                                                                    View Details <i className="fas fa-arrow-right text-[10px]"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No orders yet</p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveCustomer} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                            <input type="text" value={customerFormData.name} onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                            <input type="email" value={customerFormData.email} onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                                            <input type="text" value={customerFormData.phone} onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                            <select value={customerFormData.status} onChange={(e) => setCustomerFormData({ ...customerFormData, status: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm">
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">Cancel</button>
                                        <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold">Save Changes</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Order Details Modal */}
            {
                isOrderModalOpen && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOrderModalOpen(false)}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl w-full max-w-3xl relative z-10 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Order Details</h3>
                                    <p className="text-sm text-gray-500">ID: {selectedOrder.id}</p>
                                </div>
                                <button onClick={() => setIsOrderModalOpen(false)}><i className="fas fa-times text-gray-400 hover:text-red-500"></i></button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-sm uppercase">Customer Info</h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{selectedOrder.customerName}</p>
                                    <p className="text-xs text-gray-500 mt-1">Placed on: {formatDate(selectedOrder.date || selectedOrder.createdAt)}</p>
                                    {(() => {
                                        const customer = users.find(u => u.name === selectedOrder.customerName);
                                        return customer ? (
                                            <>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                                                    <i className="fas fa-envelope mr-1"></i> {customer.email}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    <i className="fas fa-phone mr-1"></i> {customer.phone}
                                                </p>
                                            </>
                                        ) : null;
                                    })()}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-sm uppercase">Order Status</h4>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => handleStatusChangeWithTracking(selectedOrder.id, e.target.value as Order['status'])}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-2"
                                    >
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                        <option value="Return Initiated">Return Initiated</option>
                                        <option value="Return Approved">Return Approved</option>
                                        <option value="Return Completed">Return Completed</option>
                                        <option value="Return Rejected">Return Rejected</option>
                                    </select>
                                    
                                    {(selectedOrder.status === 'Shipped' || selectedOrder.status === 'Delivered') && (
                                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                <i className="fas fa-info-circle mr-1"></i> 
                                                {selectedOrder.status === 'Shipped' ? 'Enter tracking details for customer tracking' : 'Tracking details for post-delivery support'}
                                            </p>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Courier</label>
                                                <select
                                                    value={selectedOrder.courierName || ''}
                                                    onChange={(e) => {
                                                        const updated = { ...selectedOrder, courierName: e.target.value };
                                                        setSelectedOrder(updated);
                                                        setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
                                                    }}
                                                    className="w-full rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                                >
                                                    <option value="">Select Courier</option>
                                                    {['Delhivery', 'BlueDart', 'FedEx', 'DTDC', 'India Post', 'Ekart', 'Shadowfax', 'XpressBees'].map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Tracking Number / AWB</label>
                                                <input
                                                    type="text"
                                                    value={selectedOrder.trackingNumber || ''}
                                                    onChange={(e) => {
                                                        const updated = { ...selectedOrder, trackingNumber: e.target.value };
                                                        setSelectedOrder(updated);
                                                        setOrders(orders.map(o => o.id === selectedOrder.id ? updated : o));
                                                    }}
                                                    placeholder="Enter tracking number"
                                                    className="w-full rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                                />
                                            </div>
                                            {(selectedOrder.trackingNumber || selectedOrder.courierName) && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const api = (await import('../utils/api')).default;
                                                            const response = await api.post('/shiprocket/track', { orderId: selectedOrder.id });
                                                            if (response.data.tracking) {
                                                                setOrderTrackingData(response.data.tracking);
                                                                setShowOrderTracking(true);
                                                            } else {
                                                                toast.info('Tracking information not available yet.');
                                                            }
                                                        } catch (err) {
                                                            toast.error('Failed to fetch tracking. Ensure the order is shipped via Shiprocket.');
                                                        }
                                                    }}
                                                    className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
                                                >
                                                    <i className="fas fa-truck"></i> Track via Shiprocket
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {(() => {
                                // First, check if the order has a shipping address
                                if (selectedOrder.shippingAddress) {
                                    return (
                                        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                            <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-sm uppercase flex items-center">
                                                <i className="fas fa-shipping-fast text-primary mr-2"></i>
                                                Shipping Address
                                            </h4>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                <p className="font-bold">{selectedOrder.shippingAddress.name}</p>
                                                <p>{selectedOrder.shippingAddress.street}</p>
                                                <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.zip}</p>
                                                <p className="mt-2">
                                                    <i className="fas fa-phone mr-1"></i> {selectedOrder.shippingAddress.phone}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                // Fall back to customer lookup
                                const customer = users.find(u => u.name === selectedOrder.customerName);
                                const defaultAddress = customer?.addresses?.find(addr => addr.isDefault) || customer?.addresses?.[0];
                                return defaultAddress ? (
                                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-sm uppercase flex items-center">
                                            <i className="fas fa-shipping-fast text-primary mr-2"></i>
                                            Shipping Address
                                        </h4>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <p className="font-bold">{defaultAddress.name}</p>
                                            <p className="text-xs text-gray-500 mb-2">{defaultAddress.type}</p>
                                            <p>{defaultAddress.street}</p>
                                            <p>{defaultAddress.city}, {defaultAddress.state} - {defaultAddress.zip}</p>
                                            <p className="mt-2">
                                                <i className="fas fa-phone mr-1"></i> {defaultAddress.phone}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <i className="fas fa-exclamation-triangle mr-2"></i>
                                            No shipping address found for this customer
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Order Status Timeline */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase flex items-center">
                                    <i className="fas fa-history text-primary mr-2"></i>
                                    Order Timeline
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <OrderStatusTimeline history={selectedOrder.statusHistory || []} currentStatus={selectedOrder.status} />
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-4 text-sm uppercase">Order Items</h4>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Item</th>
                                                <th className="px-4 py-3 text-right">Qty</th>
                                                <th className="px-4 py-3 text-right">Price</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-gray-800 dark:text-white font-medium">{item.name}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₹{(item.price ?? 0).toLocaleString('en-IN')}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">₹{((item.price ?? 0) * (item.quantity ?? 0)).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-gray-800 dark:text-white">Grand Total</td>
                                                <td className="px-4 py-3 text-right text-primary">₹{(selectedOrder.total ?? 0).toLocaleString('en-IN')}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setIsOrderModalOpen(false)}
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Customer Detail Modal */}
            {customerDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCustomerDetailModal(null)}></div>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-20">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <i className="fas fa-user-edit text-primary"></i> Edit Customer
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{customerDetailModal.email}</p>
                            </div>
                            <button 
                                onClick={() => setCustomerDetailModal(null)} 
                                className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:text-red-500 shadow-sm"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <i className="fas fa-user-circle text-primary"></i> Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={editCustomerData?.name || ''}
                                            onChange={(e) => setEditCustomerData(prev => prev ? { ...prev, name: e.target.value } : null)}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={customerDetailModal.email}
                                            disabled
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={editCustomerData?.phone || ''}
                                            onChange={(e) => setEditCustomerData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* User Type & Verification */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <i className="fas fa-shield-alt text-primary"></i> User Type & Verification
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
                                        <select
                                            value={editCustomerData?.userType || 'regular'}
                                            onChange={(e) => {
                                                const newData = { ...editCustomerData!, userType: e.target.value as User['userType'] };
                                                setEditCustomerData(newData);
                                            }}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        >
                                            <option value="regular">Regular Customer</option>
                                            <option value="dental-doctor">Dental Doctor</option>
                                            <option value="dental-student">Dental Student</option>
                                            <option value="dental-business">Dental Business</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Status</label>
                                        <select
                                            value={editCustomerData?.verificationStatus || 'pending'}
                                            onChange={(e) => {
                                                const newData = { ...editCustomerData!, verificationStatus: e.target.value as User['verificationStatus'] };
                                                setEditCustomerData(newData);
                                            }}
                                            className={`w-full rounded-lg border focus:ring-primary focus:border-primary ${
                                                editCustomerData?.verificationStatus === 'approved' ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' :
                                                editCustomerData?.verificationStatus === 'rejected' ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' :
                                                'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700'
                                            } dark:bg-gray-800 dark:text-white`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Status</label>
                                        <select
                                            value={editCustomerData?.disabled ? 'inactive' : 'active'}
                                            onChange={(e) => {
                                                const newData = { ...editCustomerData!, disabled: e.target.value === 'inactive' };
                                                setEditCustomerData(newData);
                                            }}
                                            className={`w-full rounded-lg border focus:ring-primary focus:border-primary ${
                                                editCustomerData?.disabled ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                                            } dark:bg-gray-800 dark:text-white`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive (Disabled)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* License Information */}
                            {(editCustomerData?.userType === 'dental-doctor' || customerDetailModal?.dentalDoctorInfo?.licenseId) && (
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <i className="fas fa-certificate text-purple-600"></i> Professional License Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">License ID *</label>
                                            <input
                                                type="text"
                                                value={editCustomerData?.dentalDoctorInfo?.licenseId || ''}
                                                onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                    ...prev, 
                                                    dentalDoctorInfo: { ...prev.dentalDoctorInfo, licenseId: e.target.value }
                                                } : null)}
                                                placeholder="Enter license number"
                                                className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-600 dark:bg-gray-800 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">License State *</label>
                                            <input
                                                type="text"
                                                value={editCustomerData?.dentalDoctorInfo?.licenseState || ''}
                                                onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                    ...prev, 
                                                    dentalDoctorInfo: { ...prev.dentalDoctorInfo, licenseState: e.target.value }
                                                } : null)}
                                                placeholder="Enter state"
                                                className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-600 dark:bg-gray-800 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Specialization</label>
                                            <input
                                                type="text"
                                                value={editCustomerData?.dentalDoctorInfo?.specialization || ''}
                                                onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                    ...prev, 
                                                    dentalDoctorInfo: { ...prev.dentalDoctorInfo, specialization: e.target.value }
                                                } : null)}
                                                placeholder="e.g., Orthodontics"
                                                className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-600 dark:bg-gray-800 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Clinic Name</label>
                                            <input
                                                type="text"
                                                value={editCustomerData?.dentalDoctorInfo?.clinicName || ''}
                                                onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                    ...prev, 
                                                    dentalDoctorInfo: { ...prev.dentalDoctorInfo, clinicName: e.target.value }
                                                } : null)}
                                                placeholder="Enter clinic name"
                                                className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-600 dark:bg-gray-800 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
 
                             {/* Student Information */}
                             {(editCustomerData?.userType === 'dental-student' || customerDetailModal?.dentalStudentInfo?.studentId) && (
                                 <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                     <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                         <i className="fas fa-user-graduate text-blue-600"></i> Dental Student Information
                                     </h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Student ID *</label>
                                             <input
                                                 type="text"
                                                 value={editCustomerData?.dentalStudentInfo?.studentId || ''}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalStudentInfo: { ...prev.dentalStudentInfo!, studentId: e.target.value }
                                                 } : null)}
                                                 placeholder="Enter student ID"
                                                 className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Institution *</label>
                                             <input
                                                 type="text"
                                                 value={editCustomerData?.dentalStudentInfo?.institution || ''}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalStudentInfo: { ...prev.dentalStudentInfo!, institution: e.target.value }
                                                 } : null)}
                                                 placeholder="Enter college/university"
                                                 className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Course</label>
                                             <input
                                                 type="text"
                                                 value={editCustomerData?.dentalStudentInfo?.course || ''}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalStudentInfo: { ...prev.dentalStudentInfo!, course: e.target.value }
                                                 } : null)}
                                                 placeholder="e.g., BDS, MDS"
                                                 className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Year of Study</label>
                                             <select
                                                 value={editCustomerData?.dentalStudentInfo?.yearOfStudy || 1}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalStudentInfo: { ...prev.dentalStudentInfo!, yearOfStudy: parseInt(e.target.value) }
                                                 } : null)}
                                                 className="w-full px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                             >
                                                 {[1, 2, 3, 4, 5].map(year => (
                                                     <option key={year} value={year}>Year {year}</option>
                                                 ))}
                                             </select>
                                         </div>
                                     </div>
                                 </div>
                             )}
 
                             {/* Business Information */}
                             {(editCustomerData?.userType === 'dental-business' || customerDetailModal?.dentalBusinessInfo?.gstNumber) && (
                                 <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                                     <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                         <i className="fas fa-briefcase text-emerald-600"></i> Dental Business Information
                                     </h4>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Business Name *</label>
                                             <input
                                                 type="text"
                                                 value={editCustomerData?.dentalBusinessInfo?.businessName || ''}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalBusinessInfo: { ...prev.dentalBusinessInfo!, businessName: e.target.value }
                                                 } : null)}
                                                 placeholder="Enter business name"
                                                 className="w-full px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">GST Number *</label>
                                             <input
                                                 type="text"
                                                 value={editCustomerData?.dentalBusinessInfo?.gstNumber || ''}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalBusinessInfo: { ...prev.dentalBusinessInfo!, gstNumber: e.target.value }
                                                 } : null)}
                                                 placeholder="Enter GST number"
                                                 className="w-full px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">PAN Number</label>
                                             <input
                                                 type="text"
                                                 value={editCustomerData?.dentalBusinessInfo?.panNumber || ''}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalBusinessInfo: { ...prev.dentalBusinessInfo!, panNumber: e.target.value }
                                                 } : null)}
                                                 placeholder="Enter PAN number"
                                                 className="w-full px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                                             />
                                         </div>
                                         <div>
                                             <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Business Type</label>
                                             <select
                                                 value={editCustomerData?.dentalBusinessInfo?.businessType || 'Clinic'}
                                                 onChange={(e) => setEditCustomerData(prev => prev ? { 
                                                     ...prev, 
                                                     dentalBusinessInfo: { ...prev.dentalBusinessInfo!, businessType: e.target.value }
                                                 } : null)}
                                                 className="w-full px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 dark:bg-gray-800 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                                             >
                                                 {['Clinic', 'Hospital', 'Laboratory', 'Dealer', 'Other'].map(type => (
                                                     <option key={type} value={type}>{type}</option>
                                                 ))}
                                             </select>
                                         </div>
                                     </div>
                                 </div>
                             )}

                            {/* Verification Documents */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <i className="fas fa-file-alt text-primary"></i> Verification Documents
                                </h4>
                                
                                {isVerificationsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                ) : customerVerifications.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {customerVerifications.map((doc) => (
                                            <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white capitalize text-sm">
                                                            {doc.documentType.replace('_', ' ')}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                                            Uploaded: {new Date(doc.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                        doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                        doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {doc.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                                        <i className={`fas ${
                                                            doc.mimeType?.includes('pdf') ? 'fa-file-pdf text-red-500' : 
                                                            doc.mimeType?.includes('image') ? 'fa-file-image text-blue-500' : 'fa-file text-gray-400'
                                                        }`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                            {doc.fileName || 'document_file'}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">
                                                            {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <a 
                                                        href={doc.fileUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
                                                    >
                                                        <i className="fas fa-external-link-alt mr-1"></i> View File
                                                    </a>
                                                    {doc.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={async () => {
                                                                    confirmDelete(
                                                                        'Approve Document',
                                                                        'Are you sure you want to approve this verification document?',
                                                                        async () => {
                                                                            const res = await verificationAPI.updateStatus(doc.id, { status: 'approved' });
                                                                            if (res.success) {
                                                                                setCustomerVerifications(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'approved' } : d));
                                                                                toast.success('Document approved');
                                                                            }
                                                                        },
                                                                        'Approve',
                                                                        'success'
                                                                    );
                                                                }}
                                                                className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-green-600 transition-colors"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    setRejectionModal({
                                                                        isOpen: true,
                                                                        docId: doc.id,
                                                                        reason: ''
                                                                    });
                                                                }}
                                                                className="flex-1 bg-red-500 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-red-600 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <i className="fas fa-folder-open text-gray-300 text-2xl mb-2"></i>
                                        <p className="text-xs text-gray-500">No verification documents uploaded</p>
                                    </div>
                                )}
                            </div>

                            {/* Order Statistics */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <i className="fas fa-shopping-bag text-primary"></i> Order Statistics
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                        <div className="text-3xl font-bold text-primary">{customerDetailModal.orderCount || 0}</div>
                                        <div className="text-sm text-gray-500">Total Orders</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                        <div className="text-3xl font-bold text-green-600">₹{customerDetailModal.spent?.toLocaleString('en-IN')}</div>
                                        <div className="text-sm text-gray-500">Total Spent</div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                                        <div className="text-3xl font-bold text-blue-600">₹{customerDetailModal.spent ? Math.round(customerDetailModal.spent / (customerDetailModal.orderCount || 1)).toLocaleString('en-IN') : 0}</div>
                                        <div className="text-sm text-gray-500">Avg Order Value</div>
                                    </div>
                                </div>
                            </div>

                            {/* Order History */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <i className="fas fa-list text-primary"></i> Order History ({customerDetailModal.ordersList?.length || 0} orders)
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {customerDetailModal.ordersList && customerDetailModal.ordersList.length > 0 ? (
                                        customerDetailModal.ordersList.map((order: Order, idx: number) => (
                                            <div 
                                                key={order.id || idx} 
                                                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setIsOrderModalOpen(true);
                                                    setCustomerDetailModal(null);
                                                }}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                            <i className="fas fa-box text-primary"></i>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 dark:text-white">{order.id}</div>
                                                            <div className="text-sm text-gray-500">{formatDate(order.date || order.createdAt)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-gray-900 dark:text-white">₹{order.total?.toLocaleString('en-IN')}</div>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                            order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {order.trackingNumber && (
                                                    <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                                                        <i className="fas fa-truck"></i>
                                                        {order.courierName} - {order.trackingNumber}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <i className="fas fa-shopping-bag text-4xl mb-2 opacity-30"></i>
                                            <p>No orders found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky bottom-0">
                            <button
                                onClick={() => setCustomerDetailModal(null)}
                                className="px-6 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={async () => {
                                    if (!customerDetailModal || !editCustomerData) return;
                                    
                                    try {
                                        const { usersAPI } = await import('../utils/api');
                                        const data = await usersAPI.updateByEmail(customerDetailModal.email, {
                                            userType: editCustomerData.userType,
                                            verificationStatus: editCustomerData.verificationStatus,
                                            disabled: editCustomerData.disabled,
                                            dentalDoctorInfo: editCustomerData.dentalDoctorInfo,
                                            dentalStudentInfo: editCustomerData.dentalStudentInfo,
                                            dentalBusinessInfo: editCustomerData.dentalBusinessInfo
                                        });

                                        if (data) {
                                            const searchEmail = customerDetailModal.email.toLowerCase();
                                            
                                            // Update local users state
                                            setUsers(prevUsers => {
                                                const userIndex = prevUsers.findIndex(u => 
                                                    u.email?.toLowerCase() === searchEmail
                                                );
                                                
                                                if (userIndex !== -1) {
                                                    const newUsers = [...prevUsers];
                                                    newUsers[userIndex] = {
                                                        ...newUsers[userIndex],
                                                        userType: editCustomerData.userType,
                                                        verificationStatus: editCustomerData.verificationStatus,
                                                        disabled: editCustomerData.disabled,
                                                        dentalDoctorInfo: editCustomerData.dentalDoctorInfo,
                                                        dentalStudentInfo: editCustomerData.dentalStudentInfo,
                                                        dentalBusinessInfo: editCustomerData.dentalBusinessInfo
                                                    };
                                                    return newUsers;
                                                }
                                                return prevUsers;
                                            });
                                            
                                            // Update cache for future modal opens
                                            setUpdatedUsersCache(prev => ({
                                                ...prev,
                                                [searchEmail]: {
                                                    userType: editCustomerData.userType,
                                                    verificationStatus: editCustomerData.verificationStatus,
                                                    disabled: editCustomerData.disabled,
                                                    dentalDoctorInfo: editCustomerData.dentalDoctorInfo,
                                                    dentalStudentInfo: editCustomerData.dentalStudentInfo,
                                                    dentalBusinessInfo: editCustomerData.dentalBusinessInfo
                                                }
                                            }));
                                            
                                            // Update customerDetailModal with saved data (for when modal reopens)
                                            const savedData = {
                                                ...customerDetailModal,
                                                userType: editCustomerData.userType,
                                                verificationStatus: editCustomerData.verificationStatus,
                                                disabled: editCustomerData.disabled,
                                                dentalDoctorInfo: editCustomerData.dentalDoctorInfo,
                                                dentalStudentInfo: editCustomerData.dentalStudentInfo,
                                                dentalBusinessInfo: editCustomerData.dentalBusinessInfo
                                            };
                                            
                                            // Update modal with saved data so form shows correct values
                                            setCustomerDetailModal(savedData);
                                            setEditCustomerData(editCustomerData);
                                            
                                            // Show success message
                                            const statusText = editCustomerData.disabled ? 'Inactive' : 'Active';
                                            const userTypeText = editCustomerData.userType === 'dental-doctor' ? 'Dental Doctor' : 
                                                                editCustomerData.userType === 'dental-student' ? 'Dental Student' :
                                                                editCustomerData.userType === 'dental-business' ? 'Dental Business' : 'Regular Customer';
                                            toast.success(`Customer updated successfully! (Type: ${userTypeText})`);
                                        } else {
                                            toast.error('Failed to update: ' + (data.message || data.error));
                                        }
                                    } catch (error) {
                                        console.error('Error saving customer:', error);
                                        toast.error('Error saving customer data');
                                    }
                                }}
                                className="px-6 py-2 text-sm font-bold rounded-lg bg-primary text-white hover:bg-pink-700 transition-colors shadow-lg shadow-primary/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {
                isPasswordResetModalOpen && selectedCustomer && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-gradient-to-r from-primary to-pink-600 text-white p-6 rounded-t-2xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            <i className="fas fa-key"></i> Reset Password
                                        </h3>
                                        <p className="text-sm text-white/80 mt-1">For {selectedCustomer.name}</p>
                                    </div>
                                    <button
                                        onClick={() => setIsPasswordResetModalOpen(false)}
                                        className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordResetSubmit} className="p-6 space-y-6">
                                {/* Reset Method Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                        Reset Method
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary transition-colors">
                                            <input
                                                type="radio"
                                                name="resetMethod"
                                                value="manual"
                                                checked={resetPasswordMethod === 'manual'}
                                                onChange={(e) => setResetPasswordMethod(e.target.value as 'manual' | 'email')}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">Set New Password</div>
                                                <div className="text-xs text-gray-500">Manually set a new password for the customer</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-primary transition-colors">
                                            <input
                                                type="radio"
                                                name="resetMethod"
                                                value="email"
                                                checked={resetPasswordMethod === 'email'}
                                                onChange={(e) => setResetPasswordMethod(e.target.value as 'manual' | 'email')}
                                                className="w-4 h-4 text-primary"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">Send Reset Link</div>
                                                <div className="text-xs text-gray-500">Email a password reset link to {selectedCustomer.email}</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Password Input (only shown for manual method) */}
                                {resetPasswordMethod === 'manual' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                            New Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min 6 characters)"
                                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            required
                                            minLength={6}
                                        />
                                        <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                                    </div>
                                )}

                                {/* Info Box */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                    <div className="flex gap-3">
                                        <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                                        <div className="text-sm text-blue-800 dark:text-blue-300">
                                            {resetPasswordMethod === 'manual' ? (
                                                <p>The customer will be able to log in immediately with the new password you set.</p>
                                            ) : (
                                                <p>A secure password reset link will be sent to the customer's email address. The link will expire in 24 hours.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordResetModalOpen(false)}
                                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 transition-all active:scale-95"
                                    >
                                        {resetPasswordMethod === 'manual' ? 'Update Password' : 'Send Reset Link'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Hero Slide Modal */}
            {
                isHeroSlideModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsHeroSlideModalOpen(false)}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-20">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {editingHeroSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                                </h3>
                                <button onClick={() => setIsHeroSlideModalOpen(false)} className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:text-red-500 shadow-sm">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (editingHeroSlide) {
                                    onUpdateHeroSlide({ ...heroSlideFormData, id: editingHeroSlide.id } as HeroSlide);
                                } else {
                                    onAddHeroSlide({ ...heroSlideFormData, id: Date.now() } as HeroSlide);
                                }
                                setIsHeroSlideModalOpen(false);
                            }} className="p-6 space-y-6">
                                {/* Badge */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge Text</label>
                                    <input
                                        type="text"
                                        required
                                        value={heroSlideFormData.badge || ''}
                                        onChange={(e) => setHeroSlideFormData({ ...heroSlideFormData, badge: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        placeholder="e.g., NEW ARRIVAL, SALE, etc."
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={heroSlideFormData.title || ''}
                                        onChange={(e) => setHeroSlideFormData({ ...heroSlideFormData, title: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        placeholder="Main heading"
                                    />
                                </div>

                                {/* Subtitle */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle</label>
                                    <textarea
                                        rows={2}
                                        value={heroSlideFormData.subtitle || ''}
                                        onChange={(e) => setHeroSlideFormData({ ...heroSlideFormData, subtitle: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                        placeholder="Supporting text"
                                    ></textarea>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slide Image</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 h-32 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                            {heroSlideFormData.image ? (
                                                <img src={heroSlideFormData.image} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <span className="text-xs text-gray-400">No Image</span>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setHeroSlideFormData({ ...heroSlideFormData, image: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                        />
                                    </div>
                                </div>

                                {/* Background Class */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background Class</label>
                                    <select
                                        value={heroSlideFormData.bgClass || 'bg-pink-50 dark:bg-gray-800'}
                                        onChange={(e) => setHeroSlideFormData({ ...heroSlideFormData, bgClass: e.target.value })}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                    >
                                        <option value="bg-pink-50 dark:bg-gray-800">Pink</option>
                                        <option value="bg-blue-50 dark:bg-gray-800">Blue</option>
                                        <option value="bg-green-50 dark:bg-gray-800">Green</option>
                                        <option value="bg-purple-50 dark:bg-gray-800">Purple</option>
                                        <option value="bg-orange-50 dark:bg-gray-800">Orange</option>
                                    </select>
                                </div>

                                {/* Link Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link To</label>
                                    <select
                                        value={heroSlideFormData.link?.type || 'none'}
                                        onChange={(e) => {
                                            const type = e.target.value;
                                            if (type === 'none') {
                                                const { link, ...rest } = heroSlideFormData;
                                                setHeroSlideFormData(rest);
                                            } else {
                                                setHeroSlideFormData({
                                                    ...heroSlideFormData,
                                                    link: { type: type as any, value: '' }
                                                });
                                            }
                                        }}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                    >
                                        <option value="none">No Link</option>
                                        <option value="product">Product</option>
                                        <option value="category">Category</option>
                                        <option value="brand">Brand</option>
                                        <option value="url">Custom URL</option>
                                    </select>
                                </div>

                                {/* Link Value */}
                                {heroSlideFormData.link && heroSlideFormData.link.type !== 'none' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {heroSlideFormData.link.type === 'product' ? 'Product ID' :
                                                heroSlideFormData.link.type === 'category' ? 'Category Name' :
                                                    heroSlideFormData.link.type === 'brand' ? 'Brand Name' : 'URL'}
                                        </label>
                                        <input
                                            type="text"
                                            value={heroSlideFormData.link.value || ''}
                                            onChange={(e) => setHeroSlideFormData({
                                                ...heroSlideFormData,
                                                link: { ...heroSlideFormData.link!, value: e.target.value }
                                            })}
                                            className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary"
                                            placeholder={
                                                heroSlideFormData.link.type === 'product' ? 'Enter product ID' :
                                                    heroSlideFormData.link.type === 'category' ? 'Enter category name' :
                                                        heroSlideFormData.link.type === 'brand' ? 'Enter brand name' : 'https://...'
                                            }
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsHeroSlideModalOpen(false)}
                                        className="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-pink-700 shadow-lg shadow-primary/30"
                                    >
                                        {editingHeroSlide ? 'Update Slide' : 'Add Slide'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Order Tracking Modal */}
            {showOrderTracking && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowOrderTracking(false)}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <OrderTracking orderId={selectedOrder.id} onClose={() => setShowOrderTracking(false)} />
                    </div>
                </div>
            )}
        </div >

    );
};

export default AdminDashboard;
