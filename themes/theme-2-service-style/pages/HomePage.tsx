import React, { useState } from 'react';
import { Header } from '../components/Header';
import { HeroCard } from '../components/HeroCard';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../../../types';
import '../styles/theme.css';

interface HomePageProps {
    products: Product[];
    onAddToCart?: (productId: string) => void;
    onProductClick?: (productId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
    products,
    onAddToCart,
    onProductClick
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [cartItemCount, setCartItemCount] = useState(0);

    // Filter products based on search and active filter
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeFilter === 'all') return matchesSearch;
        if (activeFilter === 'featured') return matchesSearch && product.featured;
        // Add more filter logic as needed

        return matchesSearch;
    });

    const handleAddToCart = (productId: string) => {
        setCartItemCount(prev => prev + 1);
        onAddToCart?.(productId);
    };

    // Sample featured product for hero card
    const featuredProduct = products.find(p => p.featured) || products[0];

    return (
        <div className="theme-2-service-style min-h-screen pb-20">
            {/* Header */}
            <Header
                onSearch={setSearchQuery}
                onFilterChange={setActiveFilter}
                cartItemCount={cartItemCount}
            />

            {/* Main Content */}
            <main className="px-4 py-6 space-y-8">
                {/* Hero Section */}
                <HeroCard
                    title="Premium Dental Care Products"
                    subtitle="Special Offer"
                    description="Get up to 40% off on selected dental equipment and supplies. Limited time offer!"
                    buttonText="Shop Now"
                    image={featuredProduct?.image || '/images/hero-product.png'}
                    onButtonClick={() => onProductClick?.(featuredProduct?.id || '')}
                />

                {/* Categories Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-[var(--t2-text-dark)]">
                            Shop by Category
                        </h2>
                        <button className="text-[var(--t2-orange-primary)] font-semibold text-sm hover:underline">
                            View All →
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { name: 'Instruments', icon: '🦷', color: 'from-blue-400 to-blue-500' },
                            { name: 'Equipment', icon: '⚙️', color: 'from-green-400 to-green-500' },
                            { name: 'Supplies', icon: '📦', color: 'from-purple-400 to-purple-500' },
                            { name: 'More', icon: '➕', color: 'from-orange-400 to-orange-500' },
                        ].map((category) => (
                            <button
                                key={category.name}
                                className={`bg-gradient-to-br ${category.color} rounded-2xl p-4 text-white shadow-md hover:shadow-lg transition-all hover:scale-105`}
                            >
                                <div className="text-3xl mb-2">{category.icon}</div>
                                <div className="text-xs font-semibold">{category.name}</div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Products Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--t2-text-dark)]">
                                Our Products
                            </h2>
                            <p className="text-sm text-[var(--t2-text-gray)] mt-1">
                                {filteredProducts.length} products available
                            </p>
                        </div>

                        {/* Sort Dropdown */}
                        <select className="bg-white border-2 border-[var(--t2-orange-light)] rounded-full px-4 py-2 text-sm font-medium text-[var(--t2-text-dark)] focus:outline-none focus:border-[var(--t2-orange-primary)]">
                            <option>Popular</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                            <option>Newest</option>
                            <option>Rating</option>
                        </select>
                    </div>

                    {/* Product Grid */}
                    {filteredProducts.length > 0 ? (
                        <div className="product-grid">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={{
                                        id: product.id,
                                        name: product.name,
                                        brand: product.brand || 'Generic',
                                        price: product.price,
                                        originalPrice: product.originalPrice,
                                        image: product.image,
                                        rating: product.rating || 4.5,
                                        reviewCount: product.reviews?.length || 0,
                                        inStock: product.stock > 0,
                                        badge: product.featured ? 'Featured' : undefined
                                    }}
                                    onAddToCart={handleAddToCart}
                                    onClick={onProductClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-[var(--t2-text-dark)] mb-2">
                                No products found
                            </h3>
                            <p className="text-[var(--t2-text-gray)]">
                                Try adjusting your search or filters
                            </p>
                        </div>
                    )}
                </section>

                {/* Promotional Banner */}
                <section className="bg-gradient-to-r from-[var(--t2-orange-primary)] to-[var(--t2-orange-secondary)] rounded-3xl p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">
                        🎉 Join Our Newsletter
                    </h3>
                    <p className="mb-4 text-white/90">
                        Get exclusive deals and updates on new products
                    </p>
                    <div className="flex gap-2 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-3 rounded-full text-[var(--t2-text-dark)] focus:outline-none"
                        />
                        <button className="bg-white text-[var(--t2-orange-primary)] px-6 py-3 rounded-full font-bold hover:bg-[var(--t2-cream-light)] transition-all">
                            Subscribe
                        </button>
                    </div>
                </section>
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around items-center lg:hidden z-50 shadow-lg">
                {[
                    { icon: 'fa-home', label: 'Home', active: true },
                    { icon: 'fa-th-large', label: 'Shop', active: false },
                    { icon: 'fa-heart', label: 'Wishlist', active: false },
                    { icon: 'fa-user', label: 'Account', active: false },
                ].map((item) => (
                    <button
                        key={item.label}
                        className={`flex flex-col items-center gap-1 ${item.active ? 'text-[var(--t2-orange-primary)]' : 'text-[var(--t2-text-gray)]'
                            }`}
                    >
                        <i className={`fas ${item.icon} text-xl`}></i>
                        <span className="text-xs font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};
