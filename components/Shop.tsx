
import React, { useState, useEffect, useCallback } from 'react';
import { ProductCard } from './ProductCard';
import { Product, Category, BrandProfile } from '../types';
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  
  // Server-side pagination
  const [page, setPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allLoadedProducts, setAllLoadedProducts] = useState<Product[]>([]);

  const fetchProducts = useCallback(async (pageNum: number) => {
    setIsLoadingMore(true);
    try {
      const categoryId = selectedCategories.length === 1 
        ? categories.find(c => c.name === selectedCategories[0])?.id 
        : undefined;
      const brandId = selectedBrands.length === 1
        ? brands.find(b => b.name === selectedBrands[0])?.id
        : undefined;
      
      const response = await productsAPI.getAll({
        page: pageNum,
        limit: 24,
        categoryId,
        brandId,
        search: searchQuery || undefined
      });
      
      const newProducts = response.products || [];
      setTotalProducts(response.pagination?.total || 0);
      
      if (pageNum === 1) {
        setAllLoadedProducts(newProducts);
      } else {
        setAllLoadedProducts(prev => [...prev, ...newProducts]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selectedCategories, selectedBrands, searchQuery, categories, brands]);

  // Initial load and when filters change
  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [selectedCategories, selectedBrands, searchQuery]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  // Use API products if loaded, otherwise fall back to initial products
  const products = allLoadedProducts.length > 0 ? allLoadedProducts : initialProducts;

  // Derive Single Active Brand or Category Profile
  const activeBrandProfile = selectedBrands.length === 1 ? brands.find(b => b.name === selectedBrands[0]) : null;
  const activeCategoryProfile = selectedCategories.length === 1 ? categories.find(c => c.name === selectedCategories[0]) : null;

  useEffect(() => {
    setSelectedCategories(initialCategory ? [initialCategory] : []);
    setSelectedBrands(initialBrand ? [initialBrand] : []);
  }, [initialCategory, initialBrand]);

  useEffect(() => {
    let result = products;

    // Filter by Category
    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    // Filter by Brand
    if (selectedBrands.length > 0) {
      result = result.filter(p => p.brand && selectedBrands.includes(p.brand));
    }

    // Filter by Price
    result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    // Filter by Rating
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low-high':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high-low':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      default:
        // Featured - randomized or default order (using ID for stability here)
        result = [...result].sort((a, b) => a.id - b.id);
    }

    setFilteredProducts(result);
  }, [products, selectedCategories, selectedBrands, priceRange, minRating, sortBy, searchQuery]);

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandName)
        ? prev.filter(b => b !== brandName)
        : [...prev, brandName]
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* Brand Header */}
      {activeBrandProfile && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-8 animate-fade-in shadow-sm">
          <div className="w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center p-4">
            <img src={activeBrandProfile.logo} alt={activeBrandProfile.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
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

      {/* Category Header */}
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
        {/* Mobile Filters Backdrop */}
        {isMobileFilterOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
        )}

        {/* Filters Sidebar */}
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
            {/* Categories Filter */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Categories</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${selectedCategories.includes(cat.name) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'}`}>
                      {selectedCategories.includes(cat.name) && <i className="fas fa-check text-white text-[10px]"></i>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => toggleCategory(cat.name)}
                    />
                    <span className={`text-sm ${selectedCategories.includes(cat.name) ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands Filter */}
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">Brands</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin">
                {brands.map(brand => (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${selectedBrands.includes(brand.name) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 group-hover:border-primary'}`}>
                      {selectedBrands.includes(brand.name) && <i className="fas fa-check text-white text-[10px]"></i>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedBrands.includes(brand.name)}
                      onChange={() => toggleBrand(brand.name)}
                    />
                    <span className={`text-sm ${selectedBrands.includes(brand.name) ? 'text-primary font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>{brand.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
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

            {/* Rating Filter */}
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
          </div>

          {/* Mobile Apply Button */}
          <div className="lg:hidden mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-surface-dark pb-safe">
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold shadow-lg shadow-primary/20"
            >
              Show {filteredProducts.length} Results
            </button>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1 w-full">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <i className="fas fa-filter text-primary"></i> Filters
              </button>
              <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
                {filteredProducts.length} Products
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

          {/* Products */}
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

              {/* Pagination */}
              {totalProducts > 24 && (
                <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
                  {/* Previous */}
                  <button
                    onClick={() => { setPage(1); fetchProducts(1); }}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </button>
                  <button
                    onClick={() => { const p = page - 1; setPage(p); fetchProducts(p); }}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, Math.ceil(totalProducts / 24)) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => { setPage(pageNum); fetchProducts(pageNum); }}
                        className={`px-4 py-2 rounded-lg border ${
                          page === pageNum 
                            ? 'bg-primary text-white border-primary' 
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Next */}
                  <button
                    onClick={() => { const p = page + 1; setPage(p); fetchProducts(p); }}
                    disabled={page >= Math.ceil(totalProducts / 24)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                  <button
                    onClick={() => { const p = Math.ceil(totalProducts / 24); setPage(p); fetchProducts(p); }}
                    disabled={page >= Math.ceil(totalProducts / 24)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </button>
                </div>
              )}

              {totalProducts > 0 && (
                <div className="text-center mt-4 text-gray-500 text-sm">
                  Page {page} of {Math.ceil(totalProducts / 24)} • Showing {allLoadedProducts.length} of {totalProducts} products
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
                  setSelectedCategories([]);
                  setSelectedBrands([]);
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
