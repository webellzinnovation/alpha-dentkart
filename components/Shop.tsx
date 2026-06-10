
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProductCard } from './ProductCard';
import { Product, Category, BrandProfile } from '../types';
import OptimizedImageMemo from './OptimizedImage';
import { CustomDropdown } from './CustomDropdown';
import { productsAPI } from '../utils/api';

interface ShopProps {
  products: Product[];
  initialCategory?: string | null;
  initialBrand?: string | null;
  onProductClick?: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, attributes?: Record<string, string>) => void;
  onQuickView: (product: Product) => void;
  wishlistIds: number[];
  categories: Category[];
  brands: BrandProfile[];
  searchQuery?: string;
  onSearchUpdate?: (query: string) => void;
}

export const Shop: React.FC<ShopProps> = ({
  products: initialProducts,
  initialCategory,
  initialBrand,
  onProductClick,
  onToggleWishlist,
  onAddToCart,
  onQuickView,
  wishlistIds,
  categories,
  brands,
  searchQuery,
  onSearchUpdate
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(initialBrand || null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchIdRef = useRef(0);

  const PER_PAGE = 24;

  const fetchProducts = useCallback(async (pageNum: number, reset = false) => {
    const fetchId = ++fetchIdRef.current;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const categoryId = selectedCategory 
        ? categories.find(c => c.name === selectedCategory)?.id 
        : undefined;
      const brandId = selectedBrand
        ? brands.find(b => b.name === selectedBrand)?.id
        : undefined;
      
      const response = await productsAPI.getAll({
        page: pageNum,
        limit: PER_PAGE,
        categoryId,
        brandId,
        brandName: selectedBrand || undefined,
        search: searchQuery || undefined,
        sortBy: sortBy === 'price-low-high' ? 'price' : sortBy === 'price-high-low' ? 'price' : 'createdAt',
        sortOrder: sortBy === 'price-low-high' ? 'asc' : 'desc'
      });
      
      if (fetchId !== fetchIdRef.current) return;

      const newProducts = (response.products || []).map((p: any) => ({
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
      }));

      setTotalProducts(response.pagination?.total || 0);
      
      if (reset || pageNum === 1) {
        setFetchedProducts(newProducts);
      } else {
        setFetchedProducts(prev => [...prev, ...newProducts]);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Failed to fetch products:', error);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [selectedCategory, selectedBrand, searchQuery, categories, brands, sortBy]);

  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [selectedCategory, selectedBrand, searchQuery, sortBy]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const goToPage = (pageNum: number) => {
    setPage(pageNum);
    fetchProducts(pageNum, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const products = fetchedProducts.length > 0 ? fetchedProducts : initialProducts;
  const totalPages = Math.ceil(totalProducts / PER_PAGE);

  const filteredProducts = products.filter(p => {
    if (p.price < priceRange.min || p.price > priceRange.max) return false;
    if (minRating > 0 && p.rating < minRating) return false;
    return true;
  });

  const activeBrandProfile = selectedBrand ? brands.find(b => b.name === selectedBrand) : null;
  const activeCategoryProfile = selectedCategory ? categories.find(c => c.name === selectedCategory) : null;

  useEffect(() => {
    setSelectedCategory(initialCategory || null);
    setSelectedBrand(initialBrand || null);
  }, [initialCategory, initialBrand]);

  const toggleCategory = (categoryName: string) => {
    setSelectedCategory(prev => prev === categoryName ? null : categoryName);
  };

  const toggleBrand = (brandName: string) => {
    setSelectedBrand(prev => prev === brandName ? null : brandName);
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const hasActiveFilters = selectedCategory || selectedBrand || priceRange.max < 50000 || minRating > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="flex justify-between items-center mt-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">

      {activeBrandProfile && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-8 animate-fade-in shadow-sm">
          <div className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center p-4">
            <OptimizedImageMemo src={activeBrandProfile.logo} alt={activeBrandProfile.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" width={150} height={150} />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{activeBrandProfile.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mb-4 text-sm sm:text-base">{activeBrandProfile.description}</p>
            <div className="flex gap-4 justify-center md:justify-start text-sm">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{activeBrandProfile.productCount} Products</span>
            </div>
          </div>
        </div>
      )}

      {activeCategoryProfile && !activeBrandProfile && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8 flex items-center gap-4 sm:gap-6 animate-fade-in shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-3xl sm:text-4xl">
            <i className={activeCategoryProfile.iconClass}></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{activeCategoryProfile.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">Browse our {activeCategoryProfile.name.toLowerCase()} supplies</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {isMobileFilterOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-surface-dark p-6 overflow-y-auto transition-transform duration-300 transform 
            lg:translate-x-0 lg:sticky lg:top-4 lg:block lg:w-64 lg:p-0 lg:bg-transparent lg:dark:bg-transparent lg:z-auto lg:shadow-none lg:self-start lg:max-h-[calc(100vh-2rem)]
            ${isMobileFilterOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
          `}
        >
          <div className="flex justify-between items-center mb-6 lg:hidden">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Filters</h3>
            <button onClick={() => setIsMobileFilterOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500"><i className="fas fa-times"></i></button>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Categories</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${selectedCategory === cat.name ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'}`}>
                      {selectedCategory === cat.name && <i className="fas fa-check text-white text-[10px]"></i>}
                    </div>
                    <input type="radio" name="category" className="hidden" checked={selectedCategory === cat.name} onChange={() => toggleCategory(cat.name)} />
                    <span className={`text-sm ${selectedCategory === cat.name ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Brands</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                {brands.map(brand => (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${selectedBrand === brand.name ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'}`}>
                      {selectedBrand === brand.name && <i className="fas fa-check text-white text-[10px]"></i>}
                    </div>
                    <input type="radio" name="brand" className="hidden" checked={selectedBrand === brand.name} onChange={() => toggleBrand(brand.name)} />
                    <span className={`text-sm ${selectedBrand === brand.name ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Price Range</h4>
              <input
                type="range"
                min="0"
                max="50000"
                step="1000"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                className="w-full accent-primary h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>₹0</span>
                <span>₹{priceRange.max.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Minimum Rating</h4>
              <div className="space-y-2">
                {[4, 3, 2, 1].map(star => (
                  <label key={star} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      className="text-primary focus:ring-primary border-gray-300"
                      checked={minRating === star}
                      onChange={() => setMinRating(star)}
                    />
                    <div className="flex text-yellow-400 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className={`${i < star ? 'fas' : 'far'} fa-star`}></i>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">& Up</span>
                  </label>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                  setPriceRange({ min: 0, max: 50000 });
                  setMinRating(0);
                }}
                className="w-full py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>

          <div className="lg:hidden mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-surface-dark pb-safe">
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow-lg shadow-primary/20"
            >
              Show {filteredProducts.length === totalProducts
                ? `${totalProducts} Results`
                : `${filteredProducts.length} of ${totalProducts} Results`}
            </button>
          </div>
        </aside>

        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-filter text-primary"></i> Filters
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                {filteredProducts.length === totalProducts
                  ? `${totalProducts} Products`
                  : `${filteredProducts.length} of ${totalProducts} Products`}
              </span>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-48">
                <span className="text-sm text-gray-500 hidden sm:inline">Sort:</span>
                <CustomDropdown
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={[
                    { value: 'featured', label: 'Featured' },
                    { value: 'price-low-high', label: 'Price: Low to High' },
                    { value: 'price-high-low', label: 'Price: High to Low' },
                    { value: 'rating', label: 'Top Rated' }
                  ]}
                  className="w-full"
                  align="right"
                />
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={onProductClick}
                    onToggleWishlist={onToggleWishlist}
                    onAddToCart={onAddToCart}
                    onQuickView={onQuickView}
                    isInWishlist={wishlistIds.includes(product.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-4 py-2 rounded-lg border ${
                        page === pageNum 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </button>
                </div>
              )}

              {totalProducts > 0 && (
                <div className="text-center mt-4 text-gray-500 text-sm">
                  Page {page} of {totalPages} • Showing {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, totalProducts)} of {totalProducts} products
                </div>
              )}

              {isLoadingMore && (
                <div className="flex justify-center mt-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-surface-dark rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
              <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">No products found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                  setPriceRange({ min: 0, max: 50000 });
                  setMinRating(0);
                }}
                className="mt-6 text-primary font-medium hover:underline"
              >
                Clear All Filters
              </button>
              {searchQuery && (
                <button
                  onClick={() => onSearchUpdate?.('')}
                  className="mt-2 block mx-auto text-xs text-gray-400 hover:text-primary"
                >
                  Clear Search: "{searchQuery}"
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
