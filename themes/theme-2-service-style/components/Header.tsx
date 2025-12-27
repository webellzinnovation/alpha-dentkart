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
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4">
                {/* Top Bar */}
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/Alpha-dentkart-logo-icon.png"
                            alt="Alpha DentKart"
                            className="h-10 w-10 object-contain"
                        />
                        <img
                            src="/Alpha-dentkart-logo-600p.png"
                            alt="Alpha DentKart"
                            className="h-8 object-contain hidden sm:block"
                        />
                    </div>

                    {/* Search */}
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
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                            />
                            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                        </div>
                    </div>

                    {/* Icons */}
                    <div className="flex items-center gap-6">
                        <button className="text-gray-600 hover:text-gray-900">
                            <i className="far fa-user text-lg"></i>
                        </button>
                        <button className="relative text-gray-600 hover:text-gray-900">
                            <i className="fas fa-shopping-cart text-lg"></i>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex gap-8 h-12 items-center text-sm border-t border-gray-100">
                    <a href="#" className="text-gray-900 font-medium">Shop by Category</a>
                    <a href="#" className="text-gray-600 hover:text-gray-900">Deals</a>
                    <a href="#" className="text-gray-600 hover:text-gray-900">What's New</a>
                    <a href="#" className="text-gray-600 hover:text-gray-900">Brands</a>
                </nav>
            </div>
        </header>
    );
};
