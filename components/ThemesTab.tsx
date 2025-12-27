// Themes Page Component for Admin Dashboard
import { ThemeSwitcher } from './ThemeSwitcher';

export const ThemesTab = () => {
    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <i className="fas fa-palette text-primary"></i> Store Themes
                </h2>
            </div>

            {/* Theme Switcher */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <ThemeSwitcher />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex gap-3">
                    <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">About Themes</p>
                        <p>Themes allow you to completely change the look and layout of your store. Each theme has its own unique design, colors, and component styles. You can switch between themes instantly without losing any data. Your cart, wishlist, and all user data will be preserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
