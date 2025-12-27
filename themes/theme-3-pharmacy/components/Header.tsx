import React from 'react';
import '../styles/theme.css';

interface HeaderProps {
    onSearch?: (query: string) => void;
    cartItemCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
    onSearch,
    cartItemCount = 0
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');

    return (
        <header className="bg-white border-b" style={{ borderColor: 'var(--t3-border)' }}>
            <div className="max-w-7xl mx-auto px-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <i className="fas fa-tooth text-white text-xl"></i>
                        </div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--t3-text-primary)' }}>
                            Alpha <span className="text-green-600">DentKart</span>
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl mx-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    onSearch?.(e.target.value);
                                }}
                                placeholder="Search Medicine & Healthcare products"
                                className="w-full px-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                                style={{ borderColor: 'var(--t3-border)' }}
                            />
                            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        </div>
                    </div>

                    {/* Icons */}
                    <div className="flex items-center gap-6">
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <i className="far fa-user text-lg"></i>
                        </button>
                        <button className="relative text-gray-600 hover:text-gray-900 transition-colors">
                            <i className="fas fa-shopping-cart text-lg"></i>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex gap-8 h-12 items-center text-sm border-t" style={{ borderColor: 'var(--t3-border)' }}>
                    <a href="#" className="font-medium" style={{ color: 'var(--t3-text-primary)' }}>Shop by Category</a>
                    <a href="#" className="hover:text-gray-900 transition-colors" style={{ color: 'var(--t3-text-secondary)' }}>Deals</a>
                    <a href="#" className="hover:text-gray-900 transition-colors" style={{ color: 'var(--t3-text-secondary)' }}>What's New</a>
                    <a href="#" className="hover:text-gray-900 transition-colors" style={{ color: 'var(--t3-text-secondary)' }}>Brands</a>
                </nav>
            </div>
        </header>
    );
};
