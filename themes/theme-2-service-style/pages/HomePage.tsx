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
        { name: 'Dental Care', icon: '🦷', bg: 'var(--t2-pink)' },
        { name: 'Skin Care', icon: '💆', bg: 'var(--t2-peach)' },
        { name: 'Equipment', icon: '🩺', bg: 'var(--t2-blue)' },
        { name: 'Supplies', icon: '💊', bg: 'var(--t2-purple)' },
        { name: 'Instruments', icon: '💉', bg: 'var(--t2-yellow)' },
        { name: 'Safety', icon: '🛡️', bg: 'var(--t2-green)' }
    ];

    return (
        <div className="theme-2-service-style min-h-screen">
            <Header cartItemCount={0} />

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
                {/* Hero Banner */}
                <div className="promo-banner" style={{ background: 'var(--t2-banner-mint)' }}>
                    <div className="promo-content">
                        <h3>Order medicines and<br />Health Products</h3>
                        <p>Get up to 20% off on your first order</p>
                        <button className="btn-primary">Order Now</button>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((cat) => (
                            <div
                                key={cat.name}
                                className="category-card"
                                style={{ background: cat.bg }}
                            >
                                <div className="category-icon">
                                    <span style={{ fontSize: '28px' }}>{cat.icon}</span>
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
                <div className="promo-banner" style={{ background: 'var(--t2-banner-yellow)' }}>
                    <div className="promo-content">
                        <h3>Limited Time Offer<br />Save up to 30%</h3>
                        <p>On dental care products</p>
                        <button className="btn-primary">Shop Now</button>
                    </div>
                    <div className="promo-image">
                        <img
                            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=300&fit=crop"
                            alt="Dental products"
                        />
                    </div>
                </div>

                {/* Trending Products */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Trending Products</h2>
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
                <div className="promo-banner" style={{ background: 'var(--t2-banner-peach)' }}>
                    <div className="promo-content">
                        <h3>New Arrivals<br />Latest Equipment</h3>
                        <p>Check out our newest additions</p>
                        <button className="btn-primary">Explore</button>
                    </div>
                    <div className="promo-image">
                        <img
                            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=300&h=300&fit=crop"
                            alt="Medical equipment"
                        />
                    </div>
                </div>

                {/* Make Food */}
                <section>
                    <div className="section-header">
                        <h2 className="section-title">Make Food</h2>
                        <a href="#" className="view-all">View all →</a>
                    </div>
                    <div className="product-grid">
                        {products.slice(0, 4).map((product) => (
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
