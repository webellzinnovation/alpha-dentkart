import React from 'react';
import { HomePage } from '../themes/theme-3-pharmacy/pages/HomePage';
import { Product } from '../types';

// Sample products for Theme 3 demo
const sampleProducts: Product[] = [
    {
        id: 1001,
        name: 'Professional Dental Scaler Set',
        brand: '3M ESPE',
        price: 149.99,
        originalPrice: 199.99,
        image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400',
        rating: 4.8,
        reviews: 45,
        stock: 15,
        description: 'High-quality dental scaler set',
        category: 'instruments',
    },
    {
        id: 1002,
        name: 'LED Dental Curing Light',
        brand: 'Woodpecker',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400',
        rating: 4.9,
        reviews: 32,
        stock: 8,
        description: 'Powerful LED curing light',
        category: 'equipment',
    },
    {
        id: 1003,
        name: 'Dental Composite Kit',
        brand: 'Dentsply',
        price: 89.99,
        originalPrice: 119.99,
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
        rating: 4.7,
        reviews: 28,
        stock: 25,
        description: 'Complete composite restoration kit',
        category: 'supplies',
    },
    {
        id: 1004,
        name: 'Ultrasonic Scaler',
        brand: 'NSK',
        price: 449.99,
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400',
        rating: 5.0,
        reviews: 67,
        stock: 5,
        description: 'Professional ultrasonic scaler',
        category: 'equipment',
    },
    {
        id: 1005,
        name: 'Dental Mirror Set (12pc)',
        brand: 'Generic',
        price: 24.99,
        image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400',
        rating: 4.5,
        reviews: 15,
        stock: 50,
        description: 'Set of 12 dental mirrors',
        category: 'instruments',
    },
    {
        id: 1006,
        name: 'Dental Impression Material',
        brand: 'GC America',
        price: 64.99,
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400',
        rating: 4.6,
        reviews: 22,
        stock: 30,
        description: 'High-precision impression material',
        category: 'supplies',
    },
    {
        id: 1007,
        name: 'Dental Loupes with LED',
        brand: 'Orascoptic',
        price: 899.99,
        originalPrice: 1199.99,
        image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400',
        rating: 4.9,
        reviews: 89,
        stock: 3,
        description: 'Professional loupes with integrated LED',
        category: 'equipment',
    },
    {
        id: 1008,
        name: 'Dental Burs Assortment',
        brand: 'Komet',
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400',
        rating: 4.4,
        reviews: 12,
        stock: 40,
        description: 'Assorted dental burs pack',
        category: 'instruments',
    },
];

export const Theme3Demo: React.FC = () => {
    const handleAddToCart = (productId: string) => {
        console.log('Added to cart:', productId);
        alert(`Product ${productId} added to cart!`);
    };

    const handleProductClick = (productId: string) => {
        console.log('Product clicked:', productId);
        alert(`Viewing product ${productId}`);
    };

    return (
        <div className="min-h-screen">
            {/* Demo Banner */}
            <div className="bg-orange-500 text-white py-3 px-4 text-center sticky top-0 z-50 shadow-lg">
                <div className="flex items-center justify-center gap-3">
                    <i className="fas fa-eye"></i>
                    <span className="font-semibold">Theme 3 Preview: Pharmacy Design</span>
                    <button
                        onClick={() => window.close()}
                        className="ml-4 bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm transition-all"
                    >
                        Close Preview
                    </button>
                </div>
            </div>

            {/* Theme 3 Content */}
            <HomePage
                products={sampleProducts}
                onAddToCart={handleAddToCart}
                onProductClick={handleProductClick}
            />
        </div>
    );
};
