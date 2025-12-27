import React from 'react';
import { Product } from '../../../types';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
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
    // Convert Product to ProductCard format
    const convertProduct = (p: Product) => ({
        id: p.id.toString(),
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        rating: p.rating,
        reviewCount: typeof p.reviews === 'number' ? p.reviews : 0,
        inStock: p.stock > 0
    });

    return (
        <div className="theme-2-service-style min-h-screen bg-white">
            <Header cartItemCount={0} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Hero Banner */}
                <div className="promo-banner promo-green mb-8">
                    <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Order medicines and</div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Health Products</h2>
                        <p className="text-gray-600 mb-4">Get up to 20% off on your first order</p>
                        <button className="btn-primary">
                            Order Now
                        </button>
                    </div>
                    <div className="hidden md:block">
                        <img
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300"
                            alt="Healthcare"
                            className="w-64 h-64 object-contain"
                        />
                    </div>
                </div>

                {/* Shop by Category */}
                <div className="mb-12">
                    <div className="section-header">
                        <h2 className="section-title">Shop by Category</h2>
                        <a href="#" className="view-all">View all →</a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { name: 'Dental Care', icon: 'fas fa-tooth', color: 'bg-blue-50' },
                            { name: 'Vitamins', icon: 'fas fa-pills', color: 'bg-orange-50' },
                            { name: 'Equipment', icon: 'fas fa-stethoscope', color: 'bg-green-50' },
                            { name: 'Supplies', icon: 'fas fa-box', color: 'bg-purple-50' },
                            { name: 'Instruments', icon: 'fas fa-syringe', color: 'bg-pink-50' },
                            { name: 'Safety', icon: 'fas fa-shield-alt', color: 'bg-yellow-50' }
                        ].map((cat) => (
                            <div
                                key={cat.name}
                                className={`${cat.color} rounded-lg p-6 text-center cursor-pointer hover:shadow-sm transition-shadow`}
                            >
                                <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-full flex items-center justify-center">
                                    <i className={`${cat.icon} text-gray-700 text-xl`}></i>
                                </div>
                                <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured Products */}
                <div className="mb-12">
                    <div className="section-header">
                        <h2 className="section-title">Featured Products</h2>
                        <a href="#" className="view-all">View all →</a>
                    </div>
                    <div className="product-grid">
                        {products.slice(0, 6).map((product) => (
                            <ProductCard
                                key={product.id}
                                product={convertProduct(product)}
                                onAddToCart={onAddToCart}
                                onClick={onProductClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Promo Banner 1 */}
                <div className="promo-banner promo-yellow mb-8">
                    <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">Limited Time Offer</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Save up to 30%</h2>
                        <p className="text-gray-600 mb-4">On dental care products</p>
                        <button className="btn-primary">
                            Shop Now
                        </button>
                    </div>
                </div>

                {/* Popular Products */}
                <div className="mb-12">
                    <div className="section-header">
                        <h2 className="section-title">Popular Products</h2>
                        <a href="#" className="view-all">View all →</a>
                    </div>
                    <div className="product-grid">
                        {products.slice(6, 12).map((product) => (
                            <ProductCard
                                key={product.id}
                                product={convertProduct(product)}
                                onAddToCart={onAddToCart}
                                onClick={onProductClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Promo Banner 2 */}
                <div className="promo-banner promo-orange mb-8">
                    <div>
                        <div className="text-sm font-semibold text-gray-700 mb-2">New Arrivals</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Latest Equipment</h2>
                        <p className="text-gray-600 mb-4">Check out our newest additions</p>
                        <button className="btn-primary">
                            Explore
                        </button>
                    </div>
                </div>

                {/* All Products */}
                <div>
                    <div className="section-header">
                        <h2 className="section-title">All Products</h2>
                    </div>
                    <div className="product-grid">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={convertProduct(product)}
                                onAddToCart={onAddToCart}
                                onClick={onProductClick}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
