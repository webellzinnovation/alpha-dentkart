import React, { useState, useMemo } from 'react';
import { Product, Category, BrandProfile, ProductVariation } from '../../types';
import { toast } from 'sonner';
import { productSchema } from '../../utils/schemas';
import { productsAPI, wordpressSyncAPI } from '../../utils/api';
import { resolveProductImage } from '../../utils/image';

interface ProductsTabProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    categories: Category[];
    brands: BrandProfile[];
    onDeleteProduct?: (id: number | string) => void;
}

const SearchInput = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => (
    <div className="relative w-full sm:w-64">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
        />
    </div>
);

const Pagination = ({ currentPage, totalItems, onPageChange }: { currentPage: number, totalItems: number, onPageChange: (page: number) => void }) => {
    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} entries
            </span>
            <div className="flex items-center gap-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    <i className="fas fa-chevron-left text-xs"></i>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                        pageNum = i + 1;
                    } else if (currentPage <= 3) {
                        pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                    } else {
                        pageNum = currentPage - 2 + i;
                    }

                    if (pageNum < 1 || pageNum > totalPages) return null;

                    return (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-primary text-white shadow-md shadow-primary/20' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50'}`}
                        >
                            {pageNum}
                        </button>
                    );
                })}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    <i className="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
    );
};

const TableEmptyState = ({ colSpan, message, icon = "fas fa-search" }: { colSpan: number, message: string, icon?: string }) => (
    <tr>
        <td colSpan={colSpan} className="px-6 py-20 text-center">
            <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <i className={`${icon} text-gray-300 text-2xl`}></i>
                </div>
                <h3 className="text-gray-900 dark:text-white font-bold mb-1">{message}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
            </div>
        </td>
    </tr>
);

export const ProductsTab: React.FC<ProductsTabProps> = ({ 
    products, 
    setProducts, 
    categories, 
    brands,
    onDeleteProduct 
}) => {
    // Search & Filter States
    // Search & Filter States with Persistence
    const [productSearchTerm, setProductSearchTerm] = useState(() => localStorage.getItem('products_search') || '');
    const [productBrandFilter, setProductBrandFilter] = useState(() => localStorage.getItem('products_brand_filter') || '');
    const [productCategoryFilter, setProductCategoryFilter] = useState(() => localStorage.getItem('products_cat_filter') || '');
    const [productPage, setProductPage] = useState(1);

    // Persistence Effects
    React.useEffect(() => { localStorage.setItem('products_search', productSearchTerm); }, [productSearchTerm]);
    React.useEffect(() => { localStorage.setItem('products_brand_filter', productBrandFilter); }, [productBrandFilter]);
    React.useEffect(() => { localStorage.setItem('products_cat_filter', productCategoryFilter); }, [productCategoryFilter]);
    const itemsPerPage = 8;

    // Loading state
    const [isLoading, setIsLoading] = useState(false);

    // Modal & Form States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productFormData, setProductFormData] = useState<any>({
        name: '',
        category: '',
        price: '',
        originalPrice: '',
        image: '',
        images: [],
        brand: '',
        description: '',
        features: [],
        specs: {},
        attributes: [],
        variations: [],
        shortDescription: '',
        weight: '',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        stock: '10',
        badgeId: undefined
    });

    // Filtering Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const search = productSearchTerm.toLowerCase();
            const matchesSearch = 
                (p.name?.toLowerCase().includes(search)) ||
                (p.sku && String(p.sku).toLowerCase().includes(search)) ||
                (p.category && String(p.category).toLowerCase().includes(search)) ||
                (p.description?.toLowerCase().includes(search));
            const matchesCategory = productCategoryFilter === '' || p.category === productCategoryFilter;
            const matchesBrand = productBrandFilter === '' || p.brand === productBrandFilter;
            return matchesSearch && matchesCategory && matchesBrand;
        });
    }, [products, productSearchTerm, productCategoryFilter, productBrandFilter]);

    const currentProducts = useMemo(() => {
        const start = (productPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, productPage]);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setProductPage(1);
    }, [productSearchTerm, productCategoryFilter, productBrandFilter]);

    // Handlers
    const handleSyncProducts = async () => {
        setIsLoading(true);
        const toastId = toast.loading('Syncing products from WooCommerce...');
        try {
            // 1. Run actual background WordPress sync
            const syncRes = await wordpressSyncAPI.syncProducts(false);
            if (syncRes && syncRes.success) {
                toast.success(syncRes.message || 'WooCommerce products synced successfully!', { id: toastId });
            } else {
                toast.error(syncRes?.error || syncRes?.message || 'Sync completed with warnings', { id: toastId });
            }

            // 2. Load the updated products from Firestore
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
                    stock: p.stock ?? 10,
                    slug: p.slug,
                    type: p.type,
                    sku: p.sku,
                }));
                setProducts(transformed);
            }
        } catch (err: any) {
            console.error("❌ Failed to sync products:", err);
            toast.error(err?.message || "Failed to sync products", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNewProduct = () => {
        setEditingProduct(null);
        setProductFormData({
            name: '',
            category: categories[0]?.name || '',
            price: '',
            originalPrice: '',
            image: '',
            images: [],
            brand: brands[0]?.name || '',
            description: '',
            features: [],
            specs: {},
            attributes: [],
            variations: [],
            shortDescription: '',
            weight: '',
            seoTitle: '',
            seoDescription: '',
            seoKeywords: '',
            stock: '10',
            badgeId: undefined
        });
        setIsProductModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setProductFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            originalPrice: (product.originalPrice || product.price).toString(),
            image: product.image,
            images: product.images || [product.image],
            brand: product.brand || '',
            description: product.description || '',
            features: product.features || [],
            specs: product.specs || {},
            attributes: product.attributes ? product.attributes.map(a => ({ name: a.name, optionsStr: a.options.join(', ') })) : [],
            variations: product.variations || [],
            shortDescription: product.shortDescription || '',
            weight: product.weight || '',
            seoTitle: product.seoTitle || '',
            seoDescription: product.seoDescription || '',
            seoKeywords: product.seoKeywords || '',
            stock: (product.stock ?? 10).toString(),
            badgeId: product.badgeId
        });
        setIsProductModalOpen(true);
    };



    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const finalAttributes = productFormData.attributes.map((a: any) => ({
                name: a.name,
                options: a.optionsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s)
            })).filter((a: any) => a.name && a.options.length > 0);

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

            const validation = productSchema.safeParse(productData);
            if (!validation.success) {
                toast.error(validation.error.issues[0].message);
                setIsLoading(false);
                return;
            }

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
            toast.error('Failed to save product');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper functions for form
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProductFormData((prev: any) => ({ ...prev, image: reader.result as string }));
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
                        setProductFormData((prev: any) => ({ ...prev, images: [...(prev.images || []), reader.result as string] }));
                    }
                };
                reader.readAsDataURL(file as File);
            });
        }
    };

    const removeGalleryImage = (index: number) => {
        setProductFormData((prev: any) => ({
            ...prev,
            images: prev.images.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleAddAttribute = () => {
        setProductFormData((prev: any) => ({
            ...prev,
            attributes: [...prev.attributes, { name: '', optionsStr: '' }]
        }));
    };

    const handleAttributeChange = (index: number, field: 'name' | 'optionsStr', value: string) => {
        const newAttrs = [...productFormData.attributes];
        newAttrs[index][field] = value;
        setProductFormData({ ...productFormData, attributes: newAttrs });
    };

    const handleRemoveAttribute = (index: number) => {
        setProductFormData((prev: any) => ({
            ...prev,
            attributes: prev.attributes.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleGenerateVariations = () => {
        const validAttributes = productFormData.attributes.filter((a: any) => a.name && a.optionsStr);
        if (validAttributes.length === 0) {
            setProductFormData((prev: any) => ({ ...prev, variations: [] }));
            return;
        }

        const combinations = validAttributes.reduce((acc: any[], attr: any) => {
            const options = attr.optionsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            if (acc.length === 0) {
                return options.map(opt => ({ [attr.name]: opt }));
            }
            return acc.flatMap(existing => options.map(opt => ({ ...existing, [attr.name]: opt })));
        }, []);

        const newVariations: ProductVariation[] = combinations.map((combo: any) => {
            const existing = productFormData.variations.find((v: any) =>
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

        setProductFormData((prev: any) => ({ ...prev, variations: newVariations }));
    };

    const updateVariation = (id: string, field: keyof ProductVariation, value: any) => {
        setProductFormData((prev: any) => ({
            ...prev,
            variations: prev.variations.map((v: any) => v.id === id ? { ...v, [field]: value } : v)
        }));
    };

    const removeVariation = (id: string) => {
        setProductFormData((prev: any) => ({
            ...prev,
            variations: prev.variations.filter((v: any) => v.id !== id)
        }));
    };

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header / Search / Filter Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i className="fas fa-box text-primary"></i> Products List
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <select
                        value={productCategoryFilter}
                        onChange={(e) => {
                            setProductCategoryFilter(e.target.value);
                            setProductPage(1);
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>

                    <select
                        value={productBrandFilter}
                        onChange={(e) => {
                            setProductBrandFilter(e.target.value);
                            setProductPage(1);
                        }}
                        className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="">All Brands</option>
                        {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>

                    <SearchInput 
                        value={productSearchTerm} 
                        onChange={(val) => {
                            setProductSearchTerm(val);
                            setProductPage(1);
                        }} 
                        placeholder="Search products..." 
                    />

                    <button 
                        onClick={handleSyncProducts} 
                        disabled={isLoading} 
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
                    >
                        <i className={`fas fa-sync-alt mr-2 ${isLoading ? 'animate-spin' : ''}`}></i> Sync All ({products.length})
                    </button>
                    <button 
                        onClick={handleAddNewProduct} 
                        className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-pink-700 shadow-lg shadow-primary/30 flex-shrink-0 transition-transform active:scale-95 whitespace-nowrap"
                    >
                        <i className="fas fa-plus mr-2"></i> Add Product
                    </button>
                </div>
            </div>

            {/* Products Table */}
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
                                            <img src={resolveProductImage(product.image)} className="w-12 h-12 object-contain rounded-lg border bg-white p-1" alt="" />
                                            <span className="font-bold text-gray-900 dark:text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.category}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.brand}</td>
                                    <td className="px-6 py-4 font-bold text-primary">₹{(product.price ?? 0).toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button 
                                                onClick={() => handleEditProduct(product)} 
                                                className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-primary hover:text-white hover:border-primary text-gray-500 flex items-center justify-center transition-all shadow-sm" 
                                                title="Edit"
                                            >
                                                <i className="fas fa-pen text-xs"></i>
                                            </button>
                                            <button 
                                                onClick={() => onDeleteProduct ? onDeleteProduct(product.id) : null} 
                                                className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-500 hover:text-white hover:border-red-500 text-gray-500 flex items-center justify-center transition-all shadow-sm" 
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <TableEmptyState colSpan={5} message="No products found" />}
                        </tbody>
                    </table>
                </div>
                <Pagination currentPage={productPage} totalItems={filteredProducts.length} onPageChange={setProductPage} />
            </div>

            {/* Product Add/Edit Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-20">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Enter product details below</p>
                            </div>
                            <button onClick={() => setIsProductModalOpen(false)} className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center hover:text-red-500 shadow-sm transition-colors">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Product Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={productFormData.name}
                                            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            placeholder="e.g. Dental Mirror Premium"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Category <span className="text-red-500">*</span></label>
                                            <select
                                                required
                                                value={productFormData.category}
                                                onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Brand <span className="text-red-500">*</span></label>
                                            <select
                                                required
                                                value={productFormData.brand}
                                                onChange={(e) => setProductFormData({ ...productFormData, brand: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                            >
                                                {brands.map(brand => (
                                                    <option key={brand.id} value={brand.name}>{brand.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Sale Price (₹) <span className="text-red-500">*</span></label>
                                            <input
                                                type="number"
                                                required
                                                value={productFormData.price}
                                                onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Original Price (₹)</label>
                                            <input
                                                type="number"
                                                value={productFormData.originalPrice}
                                                onChange={(e) => setProductFormData({ ...productFormData, originalPrice: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Stock Quantity</label>
                                            <input
                                                type="number"
                                                value={productFormData.stock}
                                                onChange={(e) => setProductFormData({ ...productFormData, stock: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                placeholder="10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Weight (g/kg)</label>
                                            <input
                                                type="text"
                                                value={productFormData.weight}
                                                onChange={(e) => setProductFormData({ ...productFormData, weight: e.target.value })}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                placeholder="e.g. 500g"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Short Description</label>
                                        <textarea
                                            value={productFormData.shortDescription}
                                            onChange={(e) => setProductFormData({ ...productFormData, shortDescription: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                            placeholder="Brief overview..."
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Right Column: Media & SEO */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Main Image <span className="text-red-500">*</span></label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden group relative">
                                                {productFormData.image ? (
                                                    <>
                                                        <img src={resolveProductImage(productFormData.image)} className="w-full h-full object-contain p-2" alt="" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button type="button" onClick={() => setProductFormData({ ...productFormData, image: '' })} className="text-white hover:text-red-400">
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <i className="fas fa-image text-gray-300 text-xl"></i>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Gallery Images</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {productFormData.images.map((img: string, idx: number) => (
                                                <div key={idx} className="aspect-square border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 relative group overflow-hidden">
                                                    <img src={resolveProductImage(img)} className="w-full h-full object-contain p-1" alt="" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGalleryImage(idx)}
                                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="aspect-square border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                                <i className="fas fa-plus text-gray-300 text-lg mb-1"></i>
                                                <span className="text-[10px] font-bold text-gray-400">UPLOAD</span>
                                                <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <i className="fas fa-search text-primary"></i> SEO Optimization
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">SEO Title</label>
                                                <input
                                                    type="text"
                                                    value={productFormData.seoTitle}
                                                    onChange={(e) => setProductFormData({ ...productFormData, seoTitle: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary"
                                                    placeholder="Meta title..."
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400">SEO Keywords</label>
                                                <input
                                                    type="text"
                                                    value={productFormData.seoKeywords}
                                                    onChange={(e) => setProductFormData({ ...productFormData, seoKeywords: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-primary"
                                                    placeholder="keyword1, keyword2..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Width: Long Description */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Detailed Description <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    value={productFormData.description}
                                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="Full product details, specifications, etc."
                                ></textarea>
                            </div>

                            {/* Product Attributes & Variations */}
                            <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <i className="fas fa-tags text-primary"></i> Variants & Attributes
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={handleAddAttribute}
                                        className="text-xs font-bold text-primary hover:text-pink-700 flex items-center gap-2"
                                    >
                                        <i className="fas fa-plus-circle"></i> ADD ATTRIBUTE
                                    </button>
                                </div>

                                {/* Attributes List */}
                                <div className="space-y-3">
                                    {productFormData.attributes.map((attr: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-start animate-fade-in">
                                            <input
                                                type="text"
                                                placeholder="Attribute (e.g. Size)"
                                                value={attr.name}
                                                onChange={(e) => handleAttributeChange(idx, 'name', e.target.value)}
                                                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Options (comma separated)"
                                                value={attr.optionsStr}
                                                onChange={(e) => handleAttributeChange(idx, 'optionsStr', e.target.value)}
                                                className="flex-[2] px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttribute(idx)}
                                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {productFormData.attributes.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleGenerateVariations}
                                        className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
                                    >
                                        <i className="fas fa-magic mr-2"></i> GENERATE VARIANTS FROM ATTRIBUTES
                                    </button>
                                )}

                                {/* Variations Table */}
                                {productFormData.variations.length > 0 && (
                                    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-white/50 dark:bg-gray-800/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Variant</th>
                                                    <th className="px-4 py-3">Price (₹)</th>
                                                    <th className="px-4 py-3">Stock</th>
                                                    <th className="px-4 py-3 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {productFormData.variations.map((v: ProductVariation) => (
                                                    <tr key={v.id} className="text-xs">
                                                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">
                                                            {Object.entries(v.attributes).map(([key, val]) => `${key}: ${val}`).join(' / ')}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={v.price}
                                                                onChange={(e) => updateVariation(v.id, 'price', parseFloat(e.target.value))}
                                                                className="w-24 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="number"
                                                                value={v.stock}
                                                                onChange={(e) => updateVariation(v.id, 'stock', parseInt(e.target.value))}
                                                                className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button type="button" onClick={() => removeVariation(v.id)} className="text-gray-400 hover:text-red-500">
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Sticky Footer Actions */}
                            <div className="flex gap-4 pt-8 sticky bottom-0 bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-700 z-10 py-4">
                                <button
                                    type="button"
                                    onClick={() => setIsProductModalOpen(false)}
                                    className="flex-1 py-4 px-6 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-4 px-6 rounded-2xl bg-primary text-white font-bold hover:bg-pink-700 shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <i className="fas fa-circle-notch animate-spin"></i>
                                    ) : (
                                        editingProduct ? 'UPDATE PRODUCT' : 'CREATE PRODUCT'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
