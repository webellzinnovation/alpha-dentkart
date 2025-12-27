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

    return (
        <div className="space-y-6">
            {/* Section Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveSection('badges')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeSection === 'badges'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <i className="fas fa-tag mr-2"></i>
                    Product Badges
                </button>
                <button
                    onClick={() => setActiveSection('categories')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeSection === 'categories'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <i className="fas fa-th-large mr-2"></i>
                    Category Showcase
                </button>
                <button
                    onClick={() => setActiveSection('brands')}
                    className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeSection === 'brands'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    <i className="fas fa-certificate mr-2"></i>
                    Brand Showcase
                </button>
            </div>

            {/* Product Badges Section */}
            {activeSection === 'badges' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium mb-1">Product Badges</p>
                                <p>Customize the 3 badge types that can be assigned to products. You can assign badges to products in the Products tab.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {homepageSettings.badges.map(badge => (
                            <div key={badge.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{badge.name}</h3>
                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{ backgroundColor: badge.bgColor, color: badge.color }}
                                        >
                                            {badge.name.toUpperCase()}
                                        </span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Enabled</span>
                                        <input
                                            type="checkbox"
                                            checked={badge.enabled}
                                            onChange={(e) => updateBadge(badge.id, { enabled: e.target.checked })}
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                        />
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Badge Name
                                        </label>
                                        <input
                                            type="text"
                                            value={badge.name}
                                            onChange={(e) => updateBadge(badge.id, { name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Text Color
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={badge.color}
                                                onChange={(e) => updateBadge(badge.id, { color: e.target.value })}
                                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={badge.color}
                                                onChange={(e) => updateBadge(badge.id, { color: e.target.value })}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Background Color
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={badge.bgColor}
                                                onChange={(e) => updateBadge(badge.id, { bgColor: e.target.value })}
                                                className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={badge.bgColor}
                                                onChange={(e) => updateBadge(badge.id, { bgColor: e.target.value })}
                                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                                                placeholder="#ffffff"
                                            />
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium mb-1">Category Showcase</p>
                                <p>Select which categories to display on the homepage. Use the arrows to reorder them.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available Categories */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Available Categories ({categories.length})
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {categories.map(category => (
                                    <label
                                        key={category.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={homepageSettings.showcaseCategories.includes(category.name)}
                                            onChange={() => toggleCategory(category.name)}
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                        />
                                        <i className={`${category.iconClass} w-6 text-center text-gray-600 dark:text-gray-400`}></i>
                                        <span className="flex-1 text-gray-900 dark:text-white">{category.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Selected Categories */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Selected Categories ({homepageSettings.showcaseCategories.length})
                            </h3>
                            {homepageSettings.showcaseCategories.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <i className="fas fa-inbox text-4xl mb-3"></i>
                                    <p>No categories selected</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {homepageSettings.showcaseCategories.map((categoryName, index) => {
                                        const category = categories.find(c => c.name === categoryName);
                                        return (
                                            <div
                                                key={categoryName}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => moveCategoryUp(index)}
                                                        disabled={index === 0}
                                                        className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <i className="fas fa-chevron-up text-xs"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => moveCategoryDown(index)}
                                                        disabled={index === homepageSettings.showcaseCategories.length - 1}
                                                        className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <i className="fas fa-chevron-down text-xs"></i>
                                                    </button>
                                                </div>
                                                {category && <i className={`${category.iconClass} w-6 text-center text-gray-600 dark:text-gray-400`}></i>}
                                                <span className="flex-1 text-gray-900 dark:text-white font-medium">{categoryName}</span>
                                                <button
                                                    onClick={() => toggleCategory(categoryName)}
                                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
            )}

            {/* Brand Showcase Section */}
            {activeSection === 'brands' && (
                <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium mb-1">Brand Showcase</p>
                                <p>Select any number of brands (1-50+) to display on the homepage. Use the arrows to reorder them.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Available Brands */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Available Brands ({brands.length})
                            </h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {brands.map(brand => (
                                    <label
                                        key={brand.id}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={homepageSettings.showcaseBrands.includes(brand.name)}
                                            onChange={() => toggleBrand(brand.name)}
                                            className="w-5 h-5 text-primary rounded focus:ring-primary"
                                        />
                                        <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain rounded" />
                                        <div className="flex-1">
                                            <p className="text-gray-900 dark:text-white font-medium">{brand.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{brand.productCount} products</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Selected Brands */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Selected Brands ({homepageSettings.showcaseBrands.length})
                            </h3>
                            {homepageSettings.showcaseBrands.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <i className="fas fa-inbox text-4xl mb-3"></i>
                                    <p>No brands selected</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {homepageSettings.showcaseBrands.map((brandName, index) => {
                                        const brand = brands.find(b => b.name === brandName);
                                        return (
                                            <div
                                                key={brandName}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() => moveBrandUp(index)}
                                                        disabled={index === 0}
                                                        className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <i className="fas fa-chevron-up text-xs"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => moveBrandDown(index)}
                                                        disabled={index === homepageSettings.showcaseBrands.length - 1}
                                                        className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <i className="fas fa-chevron-down text-xs"></i>
                                                    </button>
                                                </div>
                                                {brand && <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain rounded" />}
                                                <div className="flex-1">
                                                    <p className="text-gray-900 dark:text-white font-medium">{brandName}</p>
                                                    {brand && <p className="text-xs text-gray-500 dark:text-gray-400">{brand.productCount} products</p>}
                                                </div>
                                                <button
                                                    onClick={() => toggleBrand(brandName)}
                                                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
            )}
        </div>
    );
};
