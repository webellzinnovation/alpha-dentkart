import React, { useState, useMemo } from 'react';
import { Product, Category, BrandProfile } from '../../types';
import { toast } from 'sonner';
import { productsAPI } from '../../utils/api';
import { resolveProductImage } from '../../utils/image';
import { 
    Search, 
    Filter, 
    AlertTriangle, 
    Package, 
    RefreshCw, 
    Edit2, 
    ChevronLeft, 
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    Box,
    CheckCircle2,
    XCircle
} from 'lucide-react';

interface InventoryTabProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    categories: Category[];
    brands: BrandProfile[];
    onEditProduct: (product: Product) => void;
    isLoading?: boolean;
}

const LOW_STOCK_THRESHOLD = 5;

const StockProgressBar = ({ stock }: { stock: number }) => {
    const percentage = Math.min((stock / 50) * 100, 100); // Assuming 50 is a "full" stock for visualization
    let color = 'bg-emerald-500';
    if (stock === 0) color = 'bg-rose-500';
    else if (stock <= LOW_STOCK_THRESHOLD) color = 'bg-amber-500';

    return (
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
                className={`h-full ${color} transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

export const InventoryTab: React.FC<InventoryTabProps> = ({ 
    products, 
    setProducts, 
    categories, 
    brands,
    onEditProduct,
    isLoading = false
}) => {
    // States
    // States with Persistence
    const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('inventory_search') || '');
    const [categoryFilter, setCategoryFilter] = useState(() => localStorage.getItem('inventory_cat_filter') || 'all');
    const [brandFilter, setBrandFilter] = useState(() => localStorage.getItem('inventory_brand_filter') || 'all');
    const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('inventory_status_filter') || 'all'); // all, low, out, in
    const [currentPage, setCurrentPage] = useState(1);
    const [isSyncing, setIsSyncing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    // Persistence Effects
    React.useEffect(() => { localStorage.setItem('inventory_search', searchTerm); }, [searchTerm]);
    React.useEffect(() => { localStorage.setItem('inventory_cat_filter', categoryFilter); }, [categoryFilter]);
    React.useEffect(() => { localStorage.setItem('inventory_brand_filter', brandFilter); }, [brandFilter]);
    React.useEffect(() => { localStorage.setItem('inventory_status_filter', statusFilter); }, [statusFilter]);

    const itemsPerPage = 10;

    // Derived Statistics
    const stats = useMemo(() => {
        const total = products.length;
        const lowStock = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length;
        const outOfStock = products.filter(p => p.stock === 0).length;
        const healthyStock = total - lowStock - outOfStock;

        return { total, lowStock, outOfStock, healthyStock };
    }, [products]);

    // Filtering Logic
    const filteredInventory = useMemo(() => {
        return products.filter(p => {
            const search = searchTerm.toLowerCase();
            const matchesSearch = 
                (p.name?.toLowerCase().includes(search)) ||
                (p.sku && String(p.sku).toLowerCase().includes(search)) ||
                (p.category && String(p.category).toLowerCase().includes(search)) ||
                (p.brand && String(p.brand).toLowerCase().includes(search)) ||
                (String(p.id).includes(search));
            
            const matchesCategory = categoryFilter === 'all' || 
                (p.category && p.category.toLowerCase() === categoryFilter.toLowerCase());
            const matchesBrand = brandFilter === 'all' || 
                (p.brand && p.brand.toLowerCase() === brandFilter.toLowerCase());
            
            let matchesStatus = true;
            if (statusFilter === 'low') matchesStatus = (p.stock || 0) > 0 && (p.stock || 0) <= LOW_STOCK_THRESHOLD;
            else if (statusFilter === 'out') matchesStatus = (p.stock || 0) === 0;
            else if (statusFilter === 'in') matchesStatus = (p.stock || 0) > LOW_STOCK_THRESHOLD;

            return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
        });
    }, [products, searchTerm, categoryFilter, brandFilter, statusFilter]);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, brandFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
    const currentItems = filteredInventory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handlers
    const handleUpdateStock = async (id: number, newStock: number) => {
        if (newStock < 0) return;
        setUpdatingId(id);
        try {
            const product = products.find(p => p.id === id);
            if (!product) return;

            await productsAPI.update(id, { ...product, stock: newStock });
            
            setProducts(prev => prev.map(p => 
                p.id === id ? { ...p, stock: newStock } : p
            ));
            
            toast.success('Stock updated successfully');
        } catch (error) {
            console.error('Failed to update stock:', error);
            toast.error('Failed to update stock');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            toast.info('Starting sync with provider...');
            await productsAPI.sync();
            
            // Re-fetch all products after successful sync
            const response = await productsAPI.getAll({ limit: 5000 });
            
            let freshProducts: any[] = [];
            if (response && response.products) {
                freshProducts = response.products;
            } else if (response && Array.isArray(response)) {
                freshProducts = response;
            }

            if (freshProducts.length > 0) {
                const transformed = freshProducts.map((p: any) => ({
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
                    stock: (p.stock === undefined || p.stock === null) ? 0 : p.stock,
                    slug: p.slug,
                    type: p.type,
                    sku: p.sku,
                }));
                setProducts(transformed);
                toast.success(`Inventory synced! ${transformed.length} products updated.`);
            } else {
                toast.success('Inventory synced with provider');
            }
        } catch (error) {
            console.error('Failed to sync inventory:', error);
            toast.error('Failed to sync inventory');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <Box className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStock}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                            <XCircle className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Out of Stock</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.outOfStock}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Healthy Stock</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.healthyStock}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Actions Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search by name, SKU or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="low">Low Stock</option>
                            <option value="out">Out of Stock</option>
                            <option value="in">In Stock</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button 
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>Sync All</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Filters:</span>
                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-transparent border-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    <select 
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="px-3 py-1.5 bg-transparent border-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-0 cursor-pointer"
                    >
                        <option value="all">All Brands</option>
                        {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>{brand.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category & Brand</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64">Stock Level</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Quick Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {currentItems.length > 0 ? (
                                currentItems.map(product => {
                                    const isLow = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
                                    const isOut = product.stock === 0;

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-600">
                                                        {product.image ? (
                                                            <img src={resolveProductImage(product.image)} alt={product.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-full h-full p-3 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{product.name}</h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">SKU: {product.sku || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className="inline-block px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md uppercase">
                                                        {product.category}
                                                    </span>
                                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{product.brand || 'No Brand'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="font-bold text-gray-700 dark:text-gray-200">{product.stock} units</span>
                                                        <span className="text-gray-400">Target: 50</span>
                                                    </div>
                                                    <StockProgressBar stock={product.stock} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isOut ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Out of Stock
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                        <AlertTriangle className="w-3.5 h-3.5" />
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="relative group/input">
                                                        <input 
                                                            type="number"
                                                            min="0"
                                                            value={product.stock}
                                                            onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                                                            className={`w-20 px-3 py-1.5 text-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all ${updatingId === product.id ? 'opacity-50' : ''}`}
                                                            disabled={updatingId === product.id}
                                                        />
                                                        {updatingId === product.id && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-lg">
                                                                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => onEditProduct(product)}
                                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        title="Edit Product Details"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Loading inventory...</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Fetching latest stock data from server
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                <Package className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No products found</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-1">
                                                We couldn't find any products matching your current filters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex items-center gap-1 mx-2">
                                {[...Array(totalPages)].map((_, i) => {
                                    const pageNum = i + 1;
                                    // Show first, last, and pages around current
                                    if (
                                        pageNum === 1 || 
                                        pageNum === totalPages || 
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                    currentPage === pageNum 
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110' 
                                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && currentPage > 3) ||
                                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={pageNum} className="text-gray-300 dark:text-gray-600 text-xs px-1">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
