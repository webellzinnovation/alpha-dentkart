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
        { id: 'all', icon: 'fas fa-th-large' },
        { id: 'featured', icon: 'fas fa-star' },
        { id: 'categories', icon: 'fas fa-layer-group' },
        { id: 'brands', icon: 'fas fa-tags' },
        { id: 'offers', icon: 'fas fa-badge-percent' },
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
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-[var(--t2-border)]">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--t2-primary)] to-[var(--t2-primary-light)] rounded-xl flex items-center justify-center shadow-sm">
                        <i className="fas fa-tooth text-white text-lg"></i>
                    </div>
                    <h1 className="text-xl font-bold text-[var(--t2-text-dark)]">
                        Alpha <span className="text-[var(--t2-primary)]">DentKart</span>
                    </h1>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-2">
                    {/* Notification Bell */}
                    <button className="relative w-10 h-10 bg-[var(--t2-bg-soft)] rounded-lg flex items-center justify-center hover:bg-[var(--t2-primary)] hover:text-white transition-all">
                        <i className="fas fa-bell text-lg"></i>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--t2-error)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                            3
                        </span>
                    </button>

                    {/* Cart Icon */}
                    <button className="relative w-10 h-10 bg-gradient-to-br from-[var(--t2-primary)] to-[var(--t2-primary-light)] rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all">
                        <i className="fas fa-shopping-cart text-white text-lg"></i>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[var(--t2-primary)] text-xs font-bold rounded-full flex items-center justify-center border-2 border-[var(--t2-primary)]">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-3">
                <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--t2-text-gray)]"></i>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        placeholder="Search dental products..."
                        className="w-full pl-12 pr-4 py-2.5 bg-[var(--t2-bg-soft)] border border-[var(--t2-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--t2-primary)] focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Filter Chips */}
            <div className="px-4 pb-3 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => handleFilterClick(filter.id)}
                            className={`chip ${activeFilter === filter.id ? 'active' : ''}`}
                        >
                            <i className={filter.icon}></i>
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};
