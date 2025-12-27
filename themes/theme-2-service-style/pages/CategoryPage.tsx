import React, { useState } from 'react';
import { Product } from '../../../types';
import { ProductCard } from '../components/ProductCard';
import '../styles/theme.css';

interface CategoryPageProps {
    category: string;
    products: Product[];
    onProductClick?: (productId: string) => void;
    onAddToCart?: (productId: string) => void;
    onBack?: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
    category,
    products,
    onProductClick,
    onAddToCart,
    onBack
}) => {
    const [sortBy, setSortBy] = useState('popular');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

    // Get unique brands
    const brands = Array.from(new Set(products.map(p => p.brand)));

    // Filter and sort products
    const filteredProducts = products.filter(p => {
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand || '');
        return matchesPrice && matchesBrand;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        switch (sortBy) {
            case 'price-low': return a.price - b.price;
            case 'price-high': return b.price - a.price;
            case 'rating': return (b.rating || 0) - (a.rating || 0);
            default: return 0;
        }
    });

    const toggleBrand = (brand: string) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    return (
        <div className="theme-2-service-style min-h-screen bg-[var(--t2-cream-bg)]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white shadow-sm">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-[var(--t2-cream-bg)] flex items-center justify-center"
                    >
                        <i className="fas fa-arrow-left text-[var(--t2-text-dark)]"></i>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-[var(--t2-text-dark)]">{category}</h1>
                        <p className="text-sm text-[var(--t2-text-gray)]">{sortedProducts.length} products</p>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-[var(--t2-cream-bg)] flex items-center justify-center">
                        <i className="fas fa-search text-[var(--t2-text-dark)]"></i>
                    </button>
                </div>

                {/* Sort and Filter Bar */}
                <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 bg-[var(--t2-cream-bg)] rounded-full text-sm font-medium text-[var(--t2-text-dark)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--t2-orange-primary)]"
                    >
                        <option value="popular">Popular</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                    </select>

                    {brands.map(brand => (
                        <button
                            key={brand}
                            onClick={() => toggleBrand(brand)}
                            className={`chip ${selectedBrands.includes(brand) ? 'active' : ''}`}
                        >
                            {brand}
                        </button>
                    ))}
                </div>
            </header>

            {/* Products Grid */}
            <div className="p-4">
                {sortedProducts.length > 0 ? (
                    <div className="product-grid">
                        {sortedProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={{
                                    id: product.id.toString(),
                                    name: product.name,
                                    brand: product.brand || 'Generic',
                                    price: product.price,
                                    originalPrice: product.originalPrice,
                                    image: product.image,
                                    rating: product.rating || 4.5,
                                    reviewCount: typeof product.reviews === 'number' ? product.reviews : 0,
                                    inStock: product.stock > 0,
                                    badge: product.featured ? 'Featured' : undefined
                                }}
                                onAddToCart={onAddToCart}
                                onClick={onProductClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-[var(--t2-text-dark)] mb-2">
                            No products found
                        </h3>
                        <p className="text-[var(--t2-text-gray)]">
                            Try adjusting your filters
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
