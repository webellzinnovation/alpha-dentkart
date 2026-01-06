import React, { useState } from 'react';
import { ProductBadge, HomepageSettings, Category, BrandProfile } from '../types';

interface HomepageTabProps {
    homepageSettings: HomepageSettings;
    setHomepageSettings: React.Dispatch<React.SetStateAction<HomepageSettings>>;
    categories: Category[];
    brands: BrandProfile[];
}

export const HomepageTab: React.FC<HomepageTabProps> = ({
    homepageSettings,
    setHomepageSettings,
    categories,
    brands
}) => {
    const [activeSection, setActiveSection] = useState<'badges' | 'categories' | 'brands'>('badges');

    // Badge Management
    const updateBadge = (badgeId: ProductBadge['id'], updates: Partial<ProductBadge>) => {
        setHomepageSettings(prev => ({
            ...prev,
            badges: prev.badges.map(badge =>
                badge.id === badgeId ? { ...badge, ...updates } : badge
            )
        }));
    };

    // Category Management
    const toggleCategory = (categoryName: string) => {
        setHomepageSettings(prev => ({
            ...prev,
            showcaseCategories: prev.showcaseCategories.includes(categoryName)
                ? prev.showcaseCategories.filter(c => c !== categoryName)
                : [...prev.showcaseCategories, categoryName]
        }));
    };

    const moveCategoryUp = (index: number) => {
        if (index === 0) return;
        setHomepageSettings(prev => {
            const newCategories = [...prev.showcaseCategories];
            [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
            return { ...prev, showcaseCategories: newCategories };
        });
    };

    const moveCategoryDown = (index: number) => {
        if (index === homepageSettings.showcaseCategories.length - 1) return;
        setHomepageSettings(prev => {
            const newCategories = [...prev.showcaseCategories];
            [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
            return { ...prev, showcaseCategories: newCategories };
        });
    };

    // Brand Management
    const toggleBrand = (brandName: string) => {
        setHomepageSettings(prev => ({
            ...prev,
            showcaseBrands: prev.showcaseBrands.includes(brandName)
                ? prev.showcaseBrands.filter(b => b !== brandName)
                : [...prev.showcaseBrands, brandName]
        }));
    };

    const moveBrandUp = (index: number) => {
        if (index === 0) return;
        setHomepageSettings(prev => {
            const newBrands = [...prev.showcaseBrands];
            [newBrands[index - 1], newBrands[index]] = [newBrands[index], newBrands[index - 1]];
            return { ...prev, showcaseBrands: newBrands };
        });
    };

    const moveBrandDown = (index: number) => {
        if (index === homepageSettings.showcaseBrands.length - 1) return;
        setHomepageSettings(prev => {
            const newBrands = [...prev.showcaseBrands];
            [newBrands[index], newBrands[index + 1]] = [newBrands[index + 1], newBrands[index]];
            return { ...prev, showcaseBrands: newBrands };
        });
    };

    const enabledBadgesCount = homepageSettings.badges.filter(b => b.enabled).length;

    return (
        <div className="animate-fade-in space-y-6 px-6">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Active Badges</p>
                            <h3 className="text-3xl font-bold">{enabledBadgesCount}/3</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-tag text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium mb-1">Showcase Categories</p>
                            <h3 className="text-3xl font-bold">{homepageSettings.showcaseCategories.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-th-large text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg shadow-pink-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-pink-100 text-sm font-medium mb-1">Showcase Brands</p>
                            <h3 className="text-3xl font-bold">{homepageSettings.showcaseBrands.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <i className="fas fa-certificate text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveSection('badges')}
                        className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'badges'
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <i className="fas fa-tag mr-2"></i>
                        Product Badges
                    </button>
                    <button
                        onClick={() => setActiveSection('categories')}
                        className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'categories'
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <i className="fas fa-th-large mr-2"></i>
                        Category Showcase
                    </button>
                    <button
                        onClick={() => setActiveSection('brands')}
                        className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all ${activeSection === 'brands'
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <i className="fas fa-certificate mr-2"></i>
                        Brand Showcase
                    </button>
                </div>
            </div>

            {/* Product Badges Section */}
            {activeSection === 'badges' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-info-circle text-white text-xl"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Product Badge System</h4>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    Customize the 3 badge types that can be assigned to products. These badges help highlight special products on your store. You can assign badges to products in the Products tab.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {homepageSettings.badges.map((badge, index) => (
                            <div key={badge.id} className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow">
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                                                <i className="fas fa-tag text-primary"></i>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Badge #{index + 1}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Customize appearance and enable/disable</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={badge.enabled}
                                                onChange={(e) => updateBadge(badge.id, { enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                                {badge.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    {/* Live Preview */}
                                    <div className="mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Live Preview</p>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="px-4 py-2 rounded-full text-sm font-bold shadow-md transition-transform hover:scale-105"
                                                style={{ backgroundColor: badge.bgColor, color: badge.color }}
                                            >
                                                {badge.name.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">← This is how it will appear on products</span>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Badge Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                                <i className="fas fa-font mr-2 text-primary"></i>
                                                Badge Name
                                            </label>
                                            <input
                                                type="text"
                                                value={badge.name}
                                                onChange={(e) => updateBadge(badge.id, { name: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-medium"
                                                placeholder="e.g., CLINIC ESSENTIAL"
                                            />
                                        </div>

                                        {/* Text Color */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                                <i className="fas fa-palette mr-2 text-primary"></i>
                                                Text Color
                                            </label>
                                            <div className="flex gap-3">
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={badge.color}
                                                        onChange={(e) => updateBadge(badge.id, { color: e.target.value })}
                                                        className="w-14 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                                                        <i className="fas fa-eyedropper text-white text-[8px]"></i>
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={badge.color}
                                                    onChange={(e) => updateBadge(badge.id, { color: e.target.value })}
                                                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>

                                        {/* Background Color */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                                <i className="fas fa-fill-drip mr-2 text-primary"></i>
                                                Background Color
                                            </label>
                                            <div className="flex gap-3">
                                                <div className="relative">
                                                    <input
                                                        type="color"
                                                        value={badge.bgColor}
                                                        onChange={(e) => updateBadge(badge.id, { bgColor: e.target.value })}
                                                        className="w-14 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md">
                                                        <i className="fas fa-eyedropper text-white text-[8px]"></i>
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={badge.bgColor}
                                                    onChange={(e) => updateBadge(badge.id, { bgColor: e.target.value })}
                                                    className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm"
                                                    placeholder="#ffffff"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Showcase Section */}
            {activeSection === 'categories' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-info-circle text-white text-xl"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">Category Showcase</h4>
                                <p className="text-sm text-purple-800 dark:text-purple-300">
                                    Select which categories to display on the homepage. Use the arrows to reorder them. Categories will appear in the order shown below.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available Categories */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        <i className="fas fa-list mr-2 text-primary"></i>
                                        Available Categories
                                    </h3>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                        {categories.length} total
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                                {categories.map(category => (
                                    <label
                                        key={category.id}
                                        className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all border-2 border-transparent hover:border-primary/20"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={homepageSettings.showcaseCategories.includes(category.name)}
                                            onChange={() => toggleCategory(category.name)}
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                        />
                                        <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                                            <i className={`${category.iconClass} text-primary`}></i>
                                        </div>
                                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{category.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Selected Categories */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        <i className="fas fa-check-circle mr-2 text-primary"></i>
                                        Selected Categories
                                    </h3>
                                    <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                                        {homepageSettings.showcaseCategories.length} selected
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                {homepageSettings.showcaseCategories.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <i className="fas fa-inbox text-4xl text-gray-300 dark:text-gray-600"></i>
                                        </div>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">No categories selected</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Select categories from the left panel</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {homepageSettings.showcaseCategories.map((categoryName, index) => {
                                            const category = categories.find(c => c.name === categoryName);
                                            return (
                                                <div
                                                    key={categoryName}
                                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => moveCategoryUp(index)}
                                                            disabled={index === 0}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <i className="fas fa-chevron-up text-xs"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => moveCategoryDown(index)}
                                                            disabled={index === homepageSettings.showcaseCategories.length - 1}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <i className="fas fa-chevron-down text-xs"></i>
                                                        </button>
                                                    </div>
                                                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-md">
                                                        {category && <i className={`${category.iconClass} text-white`}></i>}
                                                    </div>
                                                    <span className="flex-1 font-bold text-gray-900 dark:text-white">{categoryName}</span>
                                                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300">
                                                        #{index + 1}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleCategory(categoryName)}
                                                        className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Showcase Section */}
            {activeSection === 'brands' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i className="fas fa-info-circle text-white text-xl"></i>
                            </div>
                            <div>
                                <h4 className="font-bold text-pink-900 dark:text-pink-100 mb-2">Brand Showcase</h4>
                                <p className="text-sm text-pink-800 dark:text-pink-300">
                                    Select brands to display on the homepage. You can select as many as you want (1-50+). Use the arrows to reorder them.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available Brands */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        <i className="fas fa-list mr-2 text-primary"></i>
                                        Available Brands
                                    </h3>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                        {brands.length} total
                                    </span>
                                </div>
                            </div>
                            <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
                                {brands.map(brand => (
                                    <label
                                        key={brand.id}
                                        className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all border-2 border-transparent hover:border-primary/20"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={homepageSettings.showcaseBrands.includes(brand.name)}
                                            onChange={() => toggleBrand(brand.name)}
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                        />
                                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-1.5 flex items-center justify-center shadow-sm">
                                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 dark:text-white">{brand.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{brand.productCount} products</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Selected Brands */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        <i className="fas fa-check-circle mr-2 text-primary"></i>
                                        Selected Brands
                                    </h3>
                                    <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-bold shadow-md">
                                        {homepageSettings.showcaseBrands.length} selected
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                {homepageSettings.showcaseBrands.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <i className="fas fa-inbox text-4xl text-gray-300 dark:text-gray-600"></i>
                                        </div>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">No brands selected</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Select brands from the left panel</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                        {homepageSettings.showcaseBrands.map((brandName, index) => {
                                            const brand = brands.find(b => b.name === brandName);
                                            return (
                                                <div
                                                    key={brandName}
                                                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-600"
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            onClick={() => moveBrandUp(index)}
                                                            disabled={index === 0}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <i className="fas fa-chevron-up text-xs"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => moveBrandDown(index)}
                                                            disabled={index === homepageSettings.showcaseBrands.length - 1}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            <i className="fas fa-chevron-down text-xs"></i>
                                                        </button>
                                                    </div>
                                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-primary/20 p-1.5 flex items-center justify-center shadow-md">
                                                        {brand && <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-900 dark:text-white">{brandName}</p>
                                                        {brand && <p className="text-xs text-gray-500 dark:text-gray-400">{brand.productCount} products</p>}
                                                    </div>
                                                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300">
                                                        #{index + 1}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleBrand(brandName)}
                                                        className="w-9 h-9 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
