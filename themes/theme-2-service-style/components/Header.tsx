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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

    return (
        <header className="bg-white border-b border-[var(--t2-border)] sticky top-0 z-50">
            {/* Top Bar */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--t2-primary)] rounded-lg flex items-center justify-center">
                            <i className="fas fa-tooth text-white"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--t2-text-dark)]">
                            Dental<span className="text-[var(--t2-primary)]">Care</span>
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="flex-1 max-w-2xl mx-8">
                        <div className="relative">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--t2-text-gray)]"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="Search for products..."
                                className="w-full pl-12 pr-4 py-2.5 bg-[var(--t2-bg-gray)] border border-[var(--t2-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--t2-primary)] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-4">
                        <button className="text-[var(--t2-text-gray)] hover:text-[var(--t2-primary)] transition-colors">
                            <i className="far fa-user text-xl"></i>
                        </button>
                        <button className="text-[var(--t2-text-gray)] hover:text-[var(--t2-primary)] transition-colors">
                            <i className="far fa-heart text-xl"></i>
                        </button>
                        <button className="relative text-[var(--t2-text-gray)] hover:text-[var(--t2-primary)] transition-colors">
                            <i className="fas fa-shopping-cart text-xl"></i>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--t2-primary)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex gap-8 mt-4 text-sm">
                    <a href="#" className="text-[var(--t2-text-dark)] font-medium hover:text-[var(--t2-primary)] transition-colors">Categories</a>
                    <a href="#" className="text-[var(--t2-text-gray)] hover:text-[var(--t2-primary)] transition-colors">Deals</a>
                    <a href="#" className="text-[var(--t2-text-gray)] hover:text-[var(--t2-primary)] transition-colors">What's New</a>
                    <a href="#" className="text-[var(--t2-text-gray)] hover:text-[var(--t2-primary)] transition-colors">Brands</a>
                </nav>
            </div>
        </header>
    );
};
