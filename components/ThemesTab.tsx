// Simple Themes Page Component for Admin Dashboard
// This will be integrated into AdminDashboard.tsx

export const ThemesTab = () => {
    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i className="fas fa-palette text-primary"></i> Store Themes
                </h2>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2">
                    <i className="fas fa-plus"></i> Add New Theme
                </button>
            </div>

            {/* Current Theme Section */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500"></i> Active Theme
                </h3>

                {/* Theme Card */}
                <div className="border-2 border-primary rounded-xl overflow-hidden">
                    {/* Theme Preview */}
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 p-8 text-center">
                        <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                                    <i className="fas fa-paint-brush text-white text-2xl"></i>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-2xl font-bold text-gray-800 dark:text-white">Modern Pink</h4>
                                    <p className="text-gray-600 dark:text-gray-400">Clean & Professional</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Theme Details */}
                    <div className="bg-white dark:bg-gray-800 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* Color Palette */}
                            <div>
                                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <i className="fas fa-fill-drip text-primary"></i> Color Palette
                                </h5>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <div className="w-full h-12 rounded-lg bg-[#DD3B5F] mb-1"></div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Primary</p>
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full h-12 rounded-lg bg-[#F472B6] mb-1"></div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Secondary</p>
                                    </div>
                                    <div className="flex-1">
                                        <div className="w-full h-12 rounded-lg bg-[#EC4899] mb-1"></div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">Accent</p>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <i className="fas fa-star text-primary"></i> Features
                                </h5>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-check text-green-500"></i> Responsive Design
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-check text-green-500"></i> Dark Mode Support
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <i className="fas fa-check text-green-500"></i> Mobile Optimized
                                    </li>
                                </ul>
                            </div>

                            {/* Stats */}
                            <div>
                                <h5 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                    <i className="fas fa-chart-line text-primary"></i> Theme Info
                                </h5>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Version:</span>
                                        <span className="font-semibold text-gray-800 dark:text-white">1.0.0</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">Active</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                                        <span className="font-semibold text-gray-800 dark:text-white">Dec 2024</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Modern Pink is a clean and professional theme designed for dental e-commerce stores.
                                It features a contemporary pink color scheme, smooth animations, and an intuitive user interface
                                that works seamlessly across all devices.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                <i className="fas fa-eye"></i> Preview
                            </button>
                            <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                <i className="fas fa-cog"></i> Customize
                            </button>
                            <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                <i className="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Available Themes Section */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <i className="fas fa-th-large text-primary"></i> Available Themes
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Theme 2 - Service Style (Available) */}
                    <div className="border-2 border-orange-300 dark:border-orange-600 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                        {/* Preview */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <i className="fas fa-palette text-white text-2xl"></i>
                            </div>
                            <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-1">Service Style</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Warm & Friendly</p>
                        </div>

                        {/* Details */}
                        <div className="bg-white dark:bg-gray-800 p-4">
                            {/* Color Palette */}
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Color Palette</p>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-8 rounded-lg bg-[#FF9F43]"></div>
                                    <div className="flex-1 h-8 rounded-lg bg-[#FFA726]"></div>
                                    <div className="flex-1 h-8 rounded-lg bg-[#FFB74D]"></div>
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-4">
                                <li className="flex items-center gap-2">
                                    <i className="fas fa-check text-orange-500"></i> Rounded Cards
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fas fa-check text-orange-500"></i> Orange/Cream Theme
                                </li>
                                <li className="flex items-center gap-2">
                                    <i className="fas fa-check text-orange-500"></i> Mobile Bottom Nav
                                </li>
                            </ul>

                            {/* Status Badge */}
                            <div className="mb-4">
                                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                                    ✓ Available
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm">
                                    Activate
                                </button>
                                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                    <i className="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Theme 3 - Placeholder */}
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center opacity-50">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-plus text-gray-400 text-2xl"></i>
                        </div>
                        <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">More Themes</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Additional themes will be added here</p>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">About Themes</p>
                        <p>Themes allow you to completely change the look and layout of your store. Each theme has its own unique design, colors, and component styles. You can switch between themes instantly without losing any data.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
