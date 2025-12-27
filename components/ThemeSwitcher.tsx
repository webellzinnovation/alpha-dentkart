import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeSwitcher: React.FC = () => {
    const { currentTheme, setTheme } = useTheme();
    const [showConfirm, setShowConfirm] = useState(false);
    const [targetTheme, setTargetTheme] = useState<'theme-1' | 'theme-2'>('theme-1');

    const themes = [
        {
            id: 'theme-1' as const,
            name: 'Modern Pink',
            description: 'Clean and professional design with pink accents',
            colors: ['#DD3B5F', '#F472B6', '#EC4899'],
            preview: '/themes/modern-pink-preview.jpg'
        },
        {
            id: 'theme-2' as const,
            name: 'Service Style',
            description: 'Warm orange/cream theme with rounded cards',
            colors: ['#FF9F43', '#FFA726', '#FFB74D'],
            preview: '/themes/service-style-preview.jpg'
        }
    ];

    const handleActivate = (themeId: 'theme-1' | 'theme-2') => {
        if (themeId === currentTheme) return;
        setTargetTheme(themeId);
        setShowConfirm(true);
    };

    const confirmSwitch = () => {
        setTheme(targetTheme);
        setShowConfirm(false);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {themes.map((theme) => {
                    const isActive = theme.id === currentTheme;

                    return (
                        <div
                            key={theme.id}
                            className={`border-2 rounded-xl overflow-hidden transition-all ${isActive
                                    ? 'border-primary shadow-lg'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {/* Theme Preview */}
                            <div className={`p-6 text-center ${theme.id === 'theme-1'
                                    ? 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20'
                                    : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
                                }`}>
                                <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-16 h-16 rounded-full flex items-center justify-center ${theme.id === 'theme-1'
                                                    ? 'bg-primary'
                                                    : 'bg-gradient-to-br from-orange-400 to-orange-500'
                                                }`}
                                        >
                                            <i className="fas fa-palette text-white text-2xl"></i>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{theme.name}</h4>
                                            <p className="text-gray-600 dark:text-gray-400">{theme.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Theme Details */}
                            <div className="bg-white dark:bg-gray-800 p-6">
                                {/* Color Palette */}
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Color Palette</p>
                                    <div className="flex gap-2">
                                        {theme.colors.map((color, idx) => (
                                            <div key={idx} className="flex-1 h-12 rounded-lg" style={{ backgroundColor: color }}></div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="mb-4">
                                    {isActive ? (
                                        <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                                            ✓ Active
                                        </span>
                                    ) : (
                                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold">
                                            Available
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleActivate(theme.id)}
                                        disabled={isActive}
                                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isActive
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                : theme.id === 'theme-1'
                                                    ? 'bg-primary text-white hover:bg-pink-700'
                                                    : 'bg-orange-500 text-white hover:bg-orange-600'
                                            }`}
                                    >
                                        {isActive ? 'Active' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => window.open(theme.id === 'theme-2' ? '/theme2-demo' : '/', '_blank')}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        title="Preview"
                                    >
                                        <i className="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                            Switch Theme?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Are you sure you want to switch to <strong>{themes.find(t => t.id === targetTheme)?.name}</strong>?
                            Your cart and data will be preserved.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSwitch}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${targetTheme === 'theme-1'
                                        ? 'bg-primary hover:bg-pink-700'
                                        : 'bg-orange-500 hover:bg-orange-600'
                                    }`}
                            >
                                Switch Theme
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
