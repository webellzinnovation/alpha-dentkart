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
    const convertProduct = (p: Product) => ({
        id: p.id.toString(),
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        rating: p.rating,
        reviewCount: typeof p.reviews === 'number' ? p.reviews : 0
    });

    const categories = [
        { name: 'Dental Care', icon: 'fa-tooth', bg: 'var(--t3-pink)' },
        { name: 'Skin Care', icon: 'fa-spa', bg: 'var(--t3-peach)' },
        { name: 'Equipment', icon: 'fa-stethoscope', bg: 'var(--t3-blue)' },
        { name: 'Supplies', icon: 'fa-pills', bg: 'var(--t3-purple)' },
        { name: 'Instruments', icon: 'fa-syringe', bg: 'var(--t3-yellow)' },
        { name: 'Safety', icon: 'fa-shield-alt', bg: 'var(--t3-green)' }
    ];

    return (
        <div className="theme-3-pharmacy min-h-screen">
            <Header cartItemCount={0} />

            <main className="max-w-7xl mx-auto px-4 py-10 space-y-14">
                {/* Hero Banner */}
                <div className="promo-banner" style={{ background: 'var(--t3-banner-mint)' }}>
                    <div className="promo-content">
                        <div className="promo-subtitle">Order medicines and</div>
                        <h2 className="promo-title">Health Products</h2>
                        <p className="promo-description">Get up to 20% off on your first order</p>
                        <button className="btn-promo">Order Now</button>
                    </div>
                    <div className="promo-image">
                        <img
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=300&h=300&fit=crop"
                            alt="Healthcare professional"
                        />
                    </div>
                </div>

                {/* Shop by Category */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Shop by Category</h2>
                        <a href="#" className="view-all">View all →</a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        {categories.map((cat) => (
                            <div
                                key={cat.name}
                                className="category-card"
                                style={{ background: cat.bg }}
                            >
                                <div className="category-icon">
                                    <i className={`fas ${cat.icon}`} style={{ color: 'var(--t3-text-primary)' }}></i>
                                </div>
                                <div className="category-name">{cat.name}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Featured Products */}
                <section>
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
                </section>

                {/* Promo Banner 1 */}
                <div className="promo-banner" style={{ background: 'var(--t3-banner-yellow)' }}>
                    <div className="promo-content">
                        <div className="promo-subtitle">Limited Time Offer</div>
                        <h2 className="promo-title">Save up to 30%</h2>
                        <p className="promo-description">On dental care products</p>
                        <button className="btn-promo">Shop Now</button>
                    </div>
                    <div className="promo-image">
                        <img
                            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"
                            alt="Dental care"
                        />
                    </div>
                </div>

                {/* Popular Products */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Popular Products</h2>
                        <a href="#" className="view-all">View all →</a>
                    </div>
                    <div className="product-grid">
                        {products.slice(0, 8).map((product) => (
                            <ProductCard
                                key={product.id}
                                product={convertProduct(product)}
                                onAddToCart={onAddToCart}
                                onClick={onProductClick}
                            />
                        ))}
                    </div>
                </section>

                {/* Promo Banner 2 */}
                <div className="promo-banner" style={{ background: 'var(--t3-banner-peach)' }}>
                    <div className="promo-content">
                        <div className="promo-subtitle">New Arrivals</div>
                        <h2 className="promo-title">Latest Equipment</h2>
                        <p className="promo-description">Check out our newest additions</p>
                        <button className="btn-promo">Explore</button>
                    </div>
                    <div className="promo-image">
                        <img
                            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=300&h=300&fit=crop"
                            alt="Medical equipment"
                        />
                    </div>
                </div>

                {/* All Products */}
                <section>
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
                </section>
            </main>
        </div>
    );
};
