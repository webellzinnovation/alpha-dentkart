// Theme 2: Service Style - Main Export
export { Header } from './components/Header';
export { HeroCard } from './components/HeroCard';
export { ProductCard } from './components/ProductCard';
export { HomePage } from './pages/HomePage';
export { ProductDetailPage } from './pages/ProductDetailPage';
export { CategoryPage } from './pages/CategoryPage';
export { CartPage } from './pages/CartPage';

// Theme Configuration
export const theme2Config = {
    id: 'theme-2-service-style',
    name: 'Service Style',
    description: 'Warm and friendly theme with orange/cream colors and rounded cards',
    version: '1.0.0',
    colors: {
        primary: '#FF9F43',
        secondary: '#FFA726',
        background: '#FFF4E6',
    },
    features: [
        'Orange & Cream Color Scheme',
        'Heavily Rounded Cards',
        'Service Provider Aesthetic',
        'Mobile Bottom Navigation',
        'Gradient Buttons',
    ],
};
