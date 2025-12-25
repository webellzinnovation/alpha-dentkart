
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, Order, Category, BrandProfile, ProductVariation, User, HeroSlide } from '../types';
import { ThemesTab } from './ThemesTab';

interface AdminDashboardProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    brands: BrandProfile[];
    setBrands: React.Dispatch<React.SetStateAction<BrandProfile[]>>;
    users: User[];
    onLogout: () => void;
    onVisitSite: () => void;
    settings: any;
    setSettings: React.Dispatch<React.SetStateAction<any>>;
    heroSlides: HeroSlide[];
    onAddHeroSlide: (slide: HeroSlide) => void;
    onUpdateHeroSlide: (slide: HeroSlide) => void;
    onDeleteHeroSlide: (id: number) => void;
    onReorderHeroSlides: (slides: HeroSlide[]) => void;
}

const MOCK_CUSTOMERS = [
    {
        id: 1,
        name: 'Dr. Anjali Sharma',
        email: 'anjali.sharma@example.com',
        phone: '+91 98765 43210',
        orders: 12,
        spent: 156000,
        status: 'Active',
        joined: 'Jan 15, 2023',
        avatar: 'https://placehold.co/100x100/DD3B5F/white?text=AS',
        addresses: [
            { id: 101, type: 'Clinic', name: 'Smile Care Clinic', street: '123 Health Ave, Sector 15', city: 'Mumbai', state: 'Maharashtra', zip: '400001', phone: '+91 98765 43210', isDefault: true },
            { id: 102, type: 'Home', name: 'Anjali Sharma', street: 'B-402, Green Valley Apts', city: 'Mumbai', state: 'Maharashtra', zip: '400050', phone: '+91 99887 76655', isDefault: false }
        ]
    },
    {
        id: 2,
        name: 'Dr. Rahul Verma',
        email: 'rahul.verma@dentalcare.com',
        phone: '+91 99887 77665',
        orders: 5,
        spent: 45000,
        status: 'Active',
        joined: 'Mar 22, 2023',
        avatar: 'https://placehold.co/100x100/3b82f6/white?text=RV',
        addresses: [
            { id: 201, type: 'Clinic', name: 'Verma Dental Care', street: 'Shop 5, City Plaza', city: 'Delhi', state: 'Delhi', zip: '110001', phone: '+91 99887 77665', isDefault: true }
        ]
    },
    {
        id: 3,
        name: 'Dr. Priya Singh',
        email: 'priya.singh@clinic.com',
        phone: '+91 88776 66554',
        orders: 0,
        spent: 0,
        status: 'Inactive',
        joined: 'Nov 01, 2023',
        avatar: 'https://placehold.co/100x100/10b981/white?text=PS',
        addresses: []
    },
];

// --- Animated Graph Component ---
const AnimatedGraph = ({ data, labels, colorHex }: { data: number[], labels: string[], colorHex: string }) => {
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
                className="relative w-full h-64 cursor-crosshair touch-none"
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
                            {data[hoveredIndex].toLocaleString('en-IN')}
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
    categories,
    setCategories,
    brands,
    setBrands,
    users,
    onLogout,
    onVisitSite,
    settings,
    setSettings,
    heroSlides,
    onAddHeroSlide,
    onUpdateHeroSlide,
    onDeleteHeroSlide,
    onReorderHeroSlides
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'categories' | 'brands' | 'settings' | 'inventory' | 'reviews' | 'analytics' | 'hero-slides' | 'appearance' | 'themes'>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

    // Dashboard Chart State
    const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');

    // Reviews State - calculated from real data
    const reviews = useMemo(() => {
        // For now, return empty array as we don't have a reviews system yet
        // This can be expanded when you add product reviews feature
        return [];
    }, []);

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
                const orderDate = new Date(order.date);
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
                const orderDate = new Date(order.date);
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

    // Search States
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productBrandFilter, setProductBrandFilter] = useState('');
    const [productCategoryFilter, setProductCategoryFilter] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [brandSearchTerm, setBrandSearchTerm] = useState('');
    const [inventorySearchTerm, setInventorySearchTerm] = useState('');
    const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('all');
    const [inventoryBrandFilter, setInventoryBrandFilter] = useState<string>('all');


    // Pagination States
    const [productPage, setProductPage] = useState(1);
    const [orderPage, setOrderPage] = useState(1);
    const [customerPage, setCustomerPage] = useState(1);
    const [inventoryPage, setInventoryPage] = useState(1);

    const itemsPerPage = 8;

    // Order Detail State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderFilterMonth, setOrderFilterMonth] = useState<string>('all'); // Format: 'YYYY-MM' or 'all'

    // Password Reset State
    const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetPasswordMethod, setResetPasswordMethod] = useState<'manual' | 'email'>('manual');

    // Filtered orders based on month filter
    const monthFilteredOrders = useMemo(() => {
        if (orderFilterMonth === 'all') {
            return orders;
        }

        const [year, month] = orderFilterMonth.split('-').map(Number);
        return orders.filter(order => {
            try {
                const orderDate = new Date(order.date);
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
                const orderDate = new Date(order.date);
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

    // Settings Tab State
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'payment' | 'shipping' | 'email' | 'notifications'>('general');

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

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Product State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [activeProductTab, setActiveProductTab] = useState<'basic' | 'data' | 'images' | 'variations' | 'seo'>('basic');

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
    const [categoryFormData, setCategoryFormData] = useState<Category>({ id: 0, name: '', iconClass: '' });

    // Brand State
    const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandProfile | null>(null);
    const [brandFormData, setBrandFormData] = useState<BrandProfile>({ id: 0, name: '', logo: '', description: '', productCount: 0 });


    // --- Filtering & Pagination Logic ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                (p.brand && p.brand.toLowerCase().includes(productSearchTerm.toLowerCase()));

            const matchesBrand = productBrandFilter ? p.brand === productBrandFilter : true;
            const matchesCategory = productCategoryFilter ? p.category === productCategoryFilter : true;

            return matchesSearch && matchesBrand && matchesCategory;
        });
    }, [products, productSearchTerm, productBrandFilter, productCategoryFilter]);

    const filteredInventory = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                p.brand.toLowerCase().includes(inventorySearchTerm.toLowerCase());
            const matchesCategory = inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter;
            const matchesBrand = inventoryBrandFilter === 'all' || p.brand === inventoryBrandFilter;
            return matchesSearch && matchesCategory && matchesBrand;
        });
    }, [products, inventorySearchTerm, inventoryCategoryFilter, inventoryBrandFilter]);

    const currentInventory = filteredInventory.slice(
        (inventoryPage - 1) * itemsPerPage,
        inventoryPage * itemsPerPage
    );

    const currentProducts = filteredProducts.slice(
        (productPage - 1) * itemsPerPage,
        productPage * itemsPerPage
    );

    const filteredCustomers = useMemo(() => {
        // Transform real users data to include fields needed by the admin dashboard
        const transformedUsers = users.map((user, index) => {
            // Calculate total spent from orders
            const spent = user.orders?.reduce((total, order) => total + (order.total || 0), 0) || 0;

            // Determine status based on whether they have orders
            const status = (user.orders?.length || 0) > 0 ? 'Active' : 'Inactive';

            // Generate avatar from initials if not provided
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const colors = ['DD3B5F', '3b82f6', '10b981', 'f59e0b', '8b5cf6', 'ec4899'];
            const avatar = user.avatar || `https://placehold.co/100x100/${colors[index % colors.length]}/white?text=${initials}`;

            // Use current date as joined date (you may want to add this field to User type later)
            const joined = 'N/A';

            return {
                id: index + 1,
                name: user.name,
                email: user.email,
                phone: user.phone,
                orders: user.orders?.length || 0,
                spent: spent,
                status: status,
                joined: joined,
                avatar: avatar,
                addresses: user.addresses || []
            };
        });

        // Filter based on search term
        return transformedUsers.filter(c =>
            c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
        );
    }, [users, customerSearchTerm]);

    const currentCustomers = filteredCustomers.slice(
        (customerPage - 1) * itemsPerPage,
        customerPage * itemsPerPage
    );

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
                    const orderDate = new Date(o.date);
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

    const filteredCategories = useMemo(() => {
        return categories.filter(c => c.name.toLowerCase().includes(categorySearchTerm.toLowerCase()));
    }, [categories, categorySearchTerm]);

    const filteredBrands = useMemo(() => {
        return brands.filter(b => b.name.toLowerCase().includes(brandSearchTerm.toLowerCase()));
    }, [brands, brandSearchTerm]);


    // --- Handlers ---
    const confirmDelete = (title: string, message: string, action: () => void) => {
        setDeleteConfirmation({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                action();
                setDeleteConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeleteProduct = (id: number) => {
        confirmDelete(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            () => setProducts(products.filter(p => p.id !== id))
        );
    };

    const handleDeleteReview = (id: number) => {
        // Reviews are now computed from real data
        // This function is disabled until a proper reviews system is implemented
        console.log('Review deletion not yet implemented for real data');
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
            attributes: product.attributes ? product.attributes.map(a => ({ name: a.name, optionsStr: a.options.join(', ') })) : [],
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

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAttributes = productFormData.attributes.map(a => ({
            name: a.name,
            options: a.optionsStr.split(',').map(s => s.trim()).filter(s => s)
        })).filter(a => a.name && a.options.length > 0);

        const newProduct: Product = {
            id: editingProduct ? editingProduct.id : productFormData.id,
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
            rating: editingProduct ? editingProduct.rating : 0,
            reviews: editingProduct ? editingProduct.reviews : 0,
            attributes: finalAttributes,
            variations: productFormData.variations,
            seoTitle: productFormData.seoTitle,
            seoDescription: productFormData.seoDescription,
            seoKeywords: productFormData.seoKeywords,
            stock: parseInt(productFormData.stock) || 0
        };

        if (editingProduct) {
            setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...newProduct } : p));
        } else {
            setProducts([...products, newProduct]);
        }
        setIsProductModalOpen(false);
    };

    const handleUpdateStock = (productId: number, newStock: number) => {
        setProducts(products.map(p =>
            p.id === productId ? { ...p, stock: newStock } : p
        ));
    };

    const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
    };

    // Order Handlers
    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    // Customer Handlers
    const handleViewCustomer = (customer: typeof MOCK_CUSTOMERS[0]) => {
        setSelectedCustomer(customer);
        setCustomerFormData(customer);
        setIsViewCustomerMode(true);
        setIsCustomerModalOpen(true);
    };

    const handleEditCustomer = (customer: typeof MOCK_CUSTOMERS[0]) => {
        setSelectedCustomer(customer);
        setCustomerFormData({ ...customer });
        setIsViewCustomerMode(false);
        setIsCustomerModalOpen(true);
    };

    const handleDeleteCustomer = (customerId: number) => {
        confirmDelete(
            'Delete Customer',
            'Are you sure you want to delete this customer? All data and order history will be removed.',
            () => { } // Note: Users data is read-only from migration
        );
    };

    const handleSaveCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        // Note: Users data is read-only from migration
        setIsCustomerModalOpen(false);
    };

    // Category Handlers
    const handleAddNewCategory = () => {
        setEditingCategory(null);
        setCategoryFormData({ id: 0, name: '', iconClass: '' });
        setIsCategoryModalOpen(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryFormData(category);
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = (categoryId: number) => {
        confirmDelete(
            'Delete Category',
            'Are you sure you want to delete this category? Products associated with this category might be affected.',
            () => setCategories(categories.filter(c => c.id !== categoryId))
        );
    };

    const handleSaveCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            setCategories(categories.map(c => c.id === editingCategory.id ? categoryFormData : c));
        } else {
            setCategories([...categories, { ...categoryFormData, id: Date.now() }]);
        }
        setIsCategoryModalOpen(false);
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

    const handleDeleteBrand = (brandId: number) => {
        confirmDelete(
            'Delete Brand',
            'Are you sure you want to delete this brand?',
            () => setBrands(brands.filter(b => b.id !== brandId))
        );
    };

    const handleSaveBrand = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingBrand) {
            setBrands(brands.map(b => b.id === editingBrand.id ? brandFormData : b));
        } else {
            setBrands([...brands, { ...brandFormData, id: Date.now() }]);
        }
        setIsBrandModalOpen(false);
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
                alert('Password must be at least 6 characters long');
                return;
            }
            // In a real application, this would call an API to update the password
            alert(`Password for ${selectedCustomer?.name} has been updated successfully!`);
        } else {
            // Send password reset email
            alert(`Password reset link has been sent to ${selectedCustomer?.email}`);
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

    const handleSaveSettings = () => {
        alert("Settings saved successfully!");
    };

    const statusBadgeColors: Record<Order['status'], string> = {
        Processing: 'bg-amber-100 text-amber-800 border-amber-200',
        Shipped: 'bg-blue-100 text-blue-800 border-blue-200',
        Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        Cancelled: 'bg-red-100 text-red-800 border-red-200'
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
                                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                                    {settings.general.siteIcon ? (
                                        <img src={settings.general.siteIcon} alt="Icon" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-primary to-pink-600 flex items-center justify-center">
                                            <i className="fas fa-tooth text-white text-lg"></i>
                                        </div>
                                    )}
                                </div>
                            )}
                            {isSidebarOpen && (
                                settings.general.logo ? (
                                    <img src={settings.general.logo} alt="Logo" className="h-10 w-auto object-contain" />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                                            {settings.general.siteIcon ? (
                                                <img src={settings.general.siteIcon} alt="Icon" className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-tr from-primary to-pink-600 flex items-center justify-center">
                                                    <i className="fas fa-tooth text-white text-lg"></i>
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xl font-bold tracking-tight whitespace-nowrap text-gray-900 dark:text-white">
                                            {settings.general.storeName || 'AlphaAdmin'}
                                        </span>
                                    </div>
                                )
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
                            { id: 'orders', icon: 'fas fa-shopping-bag', label: 'Orders' },
                            { id: 'inventory', icon: 'fas fa-warehouse', label: 'Inventory' },
                            { id: 'products', icon: 'fas fa-box', label: 'Products' },
                            { id: 'customers', icon: 'fas fa-users', label: 'Customers' },
                            { id: 'reviews', icon: 'fas fa-star', label: 'Reviews' },
                            { id: 'categories', icon: 'fas fa-layer-group', label: 'Categories' },
                            { id: 'brands', icon: 'fas fa-tags', label: 'Brands' },
                            { id: 'hero-slides', icon: 'fas fa-images', label: 'Hero Slides' },
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
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in origin-top-right">
                                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center"><h4 className="font-bold text-gray-800 dark:text-white text-sm">Notifications</h4><span className="text-xs text-primary font-medium cursor-pointer">Mark all read</span></div>
                                        <div className="max-h-80 overflow-y-auto">
                                            <div className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex gap-3 items-start">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"><i className="fas fa-shopping-bag text-xs"></i></div>
                                                <div><p className="font-medium text-gray-800 dark:text-white text-sm">New Order Received</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Order #ORD-2023-1105 placed by Dr. Anjali</p><p className="text-[10px] text-gray-400 mt-1">2 min ago</p></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }} className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden hover:ring-2 hover:ring-indigo-100 transition-all focus:outline-none">
                                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=DD3B5F&color=fff" alt="Admin" />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="px-4 md:px-8 py-8">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="animate-fade-in space-y-8">
                                {/* Interactive Stat Cards - Click to Navigate */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard onClick={() => setActiveTab('orders')} title="Total Revenue" value={`₹${orders.reduce((acc, o) => acc + o.total, 0).toLocaleString('en-IN')}`} icon="fas fa-wallet" colorClass="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" trend="12.5%" trendUp={true} />
                                    <StatCard onClick={() => setActiveTab('orders')} title="Total Orders" value={orders.length.toString()} icon="fas fa-shopping-cart" colorClass="bg-gradient-to-br from-blue-400 to-cyan-600" trend="8.2%" trendUp={true} />
                                    <StatCard onClick={() => setActiveTab('products')} title="Total Products" value={products.length.toString()} icon="fas fa-box-open" colorClass="bg-gradient-to-br from-emerald-400 to-teal-600" trend="2.1%" trendUp={true} />
                                    <StatCard onClick={() => setActiveTab('analytics')} title="Total Visitors" value="12,340" icon="fas fa-chart-line" colorClass="bg-gradient-to-br from-orange-400 to-red-500" trend="5.4%" trendUp={true} />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Interactive Revenue Chart */}
                                    <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
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
                                            colorHex={chartView === 'weekly' ? '#6366f1' : '#DD3B5F'} // Indigo or Primary Pink
                                        />
                                    </div>

                                    {/* Recent Activity / Tiles */}
                                    <div className="space-y-6">

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
                                                        <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                                        <td className="px-6 py-4 font-medium">₹{order.total.toLocaleString('en-IN')}</td>
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
                            <div className="animate-fade-in space-y-6">
                                {/* ... (Previous Products Tab Logic) ... */}
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-box text-primary"></i> Products List</h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                        <select
                                            value={productCategoryFilter}
                                            onChange={(e) => setProductCategoryFilter(e.target.value)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>

                                        <select
                                            value={productBrandFilter}
                                            onChange={(e) => setProductBrandFilter(e.target.value)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="">All Brands</option>
                                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                        </select>

                                        <SearchInput value={productSearchTerm} onChange={setProductSearchTerm} placeholder="Search products..." />

                                        <button onClick={handleAddNewProduct} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 flex-shrink-0 transition-transform active:scale-95 whitespace-nowrap">
                                            <i className="fas fa-plus mr-2"></i> Add Product
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Product</th>
                                                    <th className="px-6 py-4">Category</th>
                                                    <th className="px-6 py-4">Brand</th>
                                                    <th className="px-6 py-4">Price</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {currentProducts.length > 0 ? currentProducts.map(product => (
                                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <img src={product.image} className="w-12 h-12 object-contain rounded-lg border bg-white p-1" alt="" />
                                                                <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.category}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.brand}</td>
                                                        <td className="px-6 py-4 font-bold text-primary">₹{product.price.toLocaleString('en-IN')}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleEditProduct(product)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Edit"><i className="fas fa-pen text-xs"></i></button>
                                                                <button onClick={() => handleDeleteProduct(product.id)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Delete"><i className="fas fa-trash text-xs"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <TableEmptyState colSpan={5} message="No products found" />}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} />
                                </div>
                            </div>
                        )}

                        {/* ORDERS TAB */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-shopping-bag text-primary"></i> Orders List
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Order ID</th>
                                                    <th className="px-6 py-4">Customer</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Total</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {currentOrders.length > 0 ? currentOrders.map(order => (
                                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.id}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{order.customerName}</td>
                                                        <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">₹{order.total.toLocaleString('en-IN')}</td>
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
                                                )) : <TableEmptyState colSpan={6} message="No orders found" icon="fas fa-shopping-bag" />}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={orderPage} totalItems={filteredOrders.length} onPageChange={setOrderPage} />
                                </div>
                            </div>
                        )}

                        {/* INVENTORY TAB */}
                        {activeTab === 'inventory' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-warehouse text-primary"></i> Inventory Management
                                    </h2>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <select
                                            value={inventoryCategoryFilter}
                                            onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={inventoryBrandFilter}
                                            onChange={(e) => setInventoryBrandFilter(e.target.value)}
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        >
                                            <option value="all">All Brands</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={brand.name}>{brand.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            value={inventorySearchTerm}
                                            onChange={(e) => setInventorySearchTerm(e.target.value)}
                                            placeholder="Search inventory..."
                                            className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-full sm:w-64"
                                        />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Product</th>
                                                    <th className="px-6 py-4">Category</th>
                                                    <th className="px-6 py-4">Brand</th>
                                                    <th className="px-6 py-4">Price</th>
                                                    <th className="px-6 py-4">Stock</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {currentInventory.length > 0 ? currentInventory.map(product => (
                                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <img src={product.image} className="w-12 h-12 object-contain rounded-lg border bg-white p-1" alt="" />
                                                                <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.category}</td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.brand}</td>
                                                        <td className="px-6 py-4 font-bold text-primary">₹{product.price.toLocaleString('en-IN')}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    value={product.stock}
                                                                    onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                                                                    className="w-20 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                                />
                                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low' : 'Out'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleEditProduct(product)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Edit">
                                                                    <i className="fas fa-pen text-xs"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <TableEmptyState colSpan={6} message="No inventory items found" icon="fas fa-warehouse" />}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={inventoryPage} totalItems={filteredInventory.length} onPageChange={setInventoryPage} />
                                </div>
                            </div>
                        )}



                        {/* CUSTOMERS TAB */}
                        {activeTab === 'customers' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-users text-primary"></i> Customers List</h2>
                                    <SearchInput value={customerSearchTerm} onChange={setCustomerSearchTerm} placeholder="Search customers..." />
                                </div>
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[800px]">
                                            <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Customer</th>
                                                    <th className="px-6 py-4">Contact</th>
                                                    <th className="px-6 py-4">Orders</th>
                                                    <th className="px-6 py-4">Spent</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                                {currentCustomers.length > 0 ? currentCustomers.map(customer => (
                                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <img src={customer.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" alt="" />
                                                                <div>
                                                                    <span className="font-bold text-gray-900 dark:text-white block">{customer.name}</span>
                                                                    <span className="text-xs text-gray-400">Joined {customer.joined}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm">
                                                                <p className="text-gray-900 dark:text-white">{customer.email}</p>
                                                                <p className="text-gray-500 text-xs">{customer.phone}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{customer.orders}</td>
                                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">₹{(customer.spent || 0).toLocaleString('en-IN')}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${customer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                                {customer.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <button onClick={() => handleViewCustomer(customer)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 flex items-center justify-center transition-all shadow-sm" title="View Details"><i className="fas fa-eye text-xs"></i></button>
                                                                <button onClick={() => handleEditCustomer(customer)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Edit"><i className="fas fa-pen text-xs"></i></button>
                                                                <button onClick={() => handleResetPassword(customer)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Reset Password"><i className="fas fa-key text-xs"></i></button>
                                                                <button onClick={() => handleDeleteCustomer(customer.id)} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 text-gray-500 flex items-center justify-center transition-all shadow-sm" title="Delete"><i className="fas fa-trash text-xs"></i></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : <TableEmptyState colSpan={6} message="No customers found" icon="fas fa-users" />}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={customerPage} totalItems={filteredCustomers.length} onPageChange={setCustomerPage} />
                                </div>
                            </div>
                        )}

                        {/* CATEGORIES TAB */}
                        {activeTab === 'categories' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-layer-group text-primary"></i> Categories</h2>
                                    <div className="flex gap-4 w-full sm:w-auto">
                                        <SearchInput value={categorySearchTerm} onChange={setCategorySearchTerm} placeholder="Search categories..." />
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
                                                {filteredCategories.length > 0 ? filteredCategories.map(cat => (
                                                    <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4 text-gray-500">#{cat.id}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                <i className={cat.iconClass}></i>
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
                            </div>
                        )}

                        {/* BRANDS TAB */}
                        {activeTab === 'brands' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-tags text-primary"></i> Brands</h2>
                                    <div className="flex gap-4 w-full sm:w-auto">
                                        <SearchInput value={brandSearchTerm} onChange={setBrandSearchTerm} placeholder="Search brands..." />
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
                                                {filteredBrands.length > 0 ? filteredBrands.map(brand => (
                                                    <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="w-16 h-16 border rounded-lg bg-white flex items-center justify-center p-2">
                                                                <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
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
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><i className="fas fa-star text-primary"></i> Product Reviews</h2>
                                    <div className="flex gap-4">
                                        <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm font-bold border border-yellow-100">
                                            Avg Rating: 4.8/5
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Rating</th>
                                                <th className="px-6 py-4">Comment</th>
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                            {reviews.map(review => (
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
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 italic max-w-xs truncate">"{review.comment}"</td>
                                                    <td className="px-6 py-4 text-gray-500 text-xs">{review.date}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleDeleteReview(review.id)} className="text-red-500 hover:text-red-700 font-medium text-xs"><i className="fas fa-trash"></i> Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
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
                                            </div>
                                        )}

                                        {/* Email Settings */}
                                        {activeSettingsTab === 'email' && (
                                            <div className="bg-white dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-4xl space-y-6 animate-fade-in">
                                                <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">SMTP Settings</h3>
                                                    <p className="text-sm text-gray-500">Configure email server for outgoing notifications.</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                                                        <input type="text" value={settings.email.host} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, host: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                                                        <input type="number" value={settings.email.port} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, port: parseInt(e.target.value) } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username / Email</label>
                                                        <input type="text" value={settings.email.user} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, user: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                                        <input type="password" value={settings.email.pass} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, pass: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                                                        <select value={settings.email.encryption} onChange={(e) => setSettings({ ...settings, email: { ...settings.email, encryption: e.target.value } })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary">
                                                            <option value="TLS">TLS</option>
                                                            <option value="SSL">SSL</option>
                                                            <option value="None">None</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="pt-4">
                                                    <button className="text-primary text-sm font-medium hover:underline">Test Connection</button>
                                                </div>
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
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleSaveSettings} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 transition-all active:scale-95">
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* HERO SLIDES TAB */}
                        {activeTab === 'hero-slides' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-images text-primary"></i> Hero Slides Management
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setEditingHeroSlide(null);
                                            setHeroSlideFormData({
                                                badge: '',
                                                title: '',
                                                subtitle: '',
                                                image: '',
                                                bgClass: 'bg-pink-50 dark:bg-gray-800',
                                                gradientClass: 'from-pink-50 via-pink-50/80'
                                            });
                                            setProductSearchQuery('');
                                            setIsHeroSlideModalOpen(true);
                                        }}
                                        className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2"
                                    >
                                        <i className="fas fa-plus"></i> Add New Slide
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {heroSlides.map((slide, index) => (
                                        <div key={slide.id} className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className={`h-40 ${slide.bgClass} relative overflow-hidden`}>
                                                {slide.image && (
                                                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent p-4 flex flex-col justify-end">
                                                    <span className="bg-white/90 text-primary text-xs font-bold px-2 py-1 rounded w-fit mb-2">{slide.badge}</span>
                                                    <h3 className="text-white font-bold text-sm line-clamp-2">{slide.title}</h3>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{slide.subtitle}</p>
                                                {slide.link && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                                                        <i className="fas fa-link mr-1"></i>
                                                        Links to: {slide.link.type} ({slide.link.value})
                                                    </p>
                                                )}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingHeroSlide(slide);
                                                            setHeroSlideFormData(slide);
                                                            setProductSearchQuery('');
                                                            setIsHeroSlideModalOpen(true);
                                                        }}
                                                        className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                                    >
                                                        <i className="fas fa-edit mr-1"></i> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this slide?')) {
                                                                onDeleteHeroSlide(slide.id);
                                                            }
                                                        }}
                                                        className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                    >
                                                        <i className="fas fa-trash mr-1"></i> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {heroSlides.length === 0 && (
                                    <div className="bg-white dark:bg-surface-dark rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                                        <i className="fas fa-images text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">No Hero Slides Yet</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first hero slide to get started</p>
                                        <button
                                            onClick={() => {
                                                setEditingHeroSlide(null);
                                                setHeroSlideFormData({
                                                    badge: '',
                                                    title: '',
                                                    subtitle: '',
                                                    image: '',
                                                    bgClass: 'bg-pink-50 dark:bg-gray-800',
                                                    gradientClass: 'from-pink-50 via-pink-50/80'
                                                });
                                                setProductSearchQuery('');
                                                setIsHeroSlideModalOpen(true);
                                            }}
                                            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors"
                                        >
                                            <i className="fas fa-plus mr-2"></i> Add First Slide
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* THEMES TAB */}
                        {activeTab === 'themes' && <ThemesTab />}
                    </div>
                </main>
            </div >

            {/* Confirmation Modal */}
            {
                deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}></div>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-md relative z-10 shadow-2xl p-6 text-center transform transition-all scale-100">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fas fa-exclamation-triangle text-2xl"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{deleteConfirmation.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">{deleteConfirmation.message}</p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteConfirmation(prev => ({ ...prev, isOpen: false }))}
                                    className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={deleteConfirmation.onConfirm}
                                    className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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
                                {['basic', 'data', 'images', 'variations', 'seo'].map((tab: any) => (
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
                                                        {productFormData.image ? <img src={productFormData.image} className="w-full h-full object-contain" alt="Main" /> : <span className="text-xs text-gray-400">Preview</span>}
                                                    </div>
                                                    <input type="file" onChange={handleProductImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gallery Images</label>
                                                <div className="flex flex-wrap gap-4 mb-4">
                                                    {productFormData.images.map((img, idx) => (
                                                        <div key={idx} className="relative w-20 h-20 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden group">
                                                            <img src={img} className="w-full h-full object-contain" alt={`Gallery ${idx}`} />
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
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Icon Class (FontAwesome)</label>
                                    <input type="text" value={categoryFormData.iconClass} onChange={(e) => setCategoryFormData({ ...categoryFormData, iconClass: e.target.value })} className="w-full rounded-lg border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm" placeholder="fas fa-tooth" />
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
                                            {brandFormData.logo ? <img src={brandFormData.logo} className="w-full h-full object-contain" /> : <span className="text-xs text-gray-400">No Img</span>}
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
                                                                    <p className="text-xs text-gray-500">{order.date}</p>
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
                                                                <p className="font-bold text-primary text-sm">Total: \u20b9{order.total.toLocaleString('en-IN')}</p>
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
                                    <p className="text-xs text-gray-500 mt-1">Placed on: {selectedOrder.date}</p>
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
                                        onChange={(e) => handleOrderStatusChange(selectedOrder.id, e.target.value as any)}
                                        className="w-full rounded-lg border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                    >
                                        <option value="Processing">Processing</option>
                                        <option value="Shipped">Shipped</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {(() => {
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
                                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">₹{item.price.toLocaleString('en-IN')}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 text-right text-gray-800 dark:text-white">Grand Total</td>
                                                <td className="px-4 py-3 text-right text-primary">₹{selectedOrder.total.toLocaleString('en-IN')}</td>
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

            {/* Password Reset Modal */}
            {isPasswordResetModalOpen && selectedCustomer && (
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
            )}

            {/* Hero Slide Modal */}
            {isHeroSlideModalOpen && (
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
            )}

        </div >

    );
};
