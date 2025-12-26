import React, { useState } from 'react';
import '../styles/theme.css';

interface HeaderProps {
    onSearch?: (query: string) => void;
    onFilterChange?: (filter: string) => void;
    cartItemCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
    onSearch,
    onFilterChange,
    cartItemCount = 0
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const filters = [
        { id: 'all', label: 'All', icon: '🏠' },
        { id: 'featured', label: 'Featured', icon: '⭐' },
        { id: 'categories', label: 'Categories', icon: '📦' },
        { id: 'brands', label: 'Brands', icon: '🏷️' },
        { id: 'offers', label: 'Offers', icon: '🎁' },
    ];

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

    const handleFilterClick = (filterId: string) => {
        setActiveFilter(filterId);
        onFilterChange?.(filterId);
    };

    return (
        <header className="sticky top-0 z-50 bg-[var(--t2-cream-bg)] shadow-sm">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--t2-orange-primary)] to-[var(--t2-orange-secondary)] rounded-2xl flex items-center justify-center shadow-md">
                        <i className="fas fa-tooth text-white text-xl"></i>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--t2-text-dark)]">
                        DentKart<span className="text-[var(--t2-orange-primary)]">⚡</span>
                    </h1>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                        <i className="fas fa-bell text-[var(--t2-text-gray)] text-lg"></i>
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--t2-red-error)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>

                    {/* Cart Icon */}
                    <button className="relative w-10 h-10 bg-gradient-to-br from-[var(--t2-orange-primary)] to-[var(--t2-orange-secondary)] rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                        <i className="fas fa-shopping-cart text-white text-lg"></i>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[var(--t2-orange-primary)] text-xs font-bold rounded-full flex items-center justify-center border-2 border-[var(--t2-orange-primary)]">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-4">
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--t2-text-gray)]"></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search dental products..."
                        className="input-search pl-12"
                    />
                </div>
            </div>

            {/* Filter Chips */}
            <div className="px-4 pb-4 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => handleFilterClick(filter.id)}
                            className={`chip ${activeFilter === filter.id ? 'active' : ''}`}
                        >
                            <span className="mr-1">{filter.icon}</span>
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};
