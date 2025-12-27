import React from 'react';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', fullScreen = false }) => {
    const containerClass = fullScreen
        ? 'fixed inset-0 bg-white dark:bg-surface-dark flex flex-col items-center justify-center z-50'
        : 'flex flex-col items-center justify-center py-20';

    return (
        <div className={containerClass}>
            {/* Logo */}
            <div className="mb-6 animate-bounce">
                <img
                    src="/Alpha-dentkart-logo-600p.png"
                    alt="Alpha DentKart"
                    className="h-20 object-contain"
                />
            </div>

            {/* Loading text */}
            <p className="text-gray-600 dark:text-gray-400 font-medium animate-pulse">{message}</p>

            {/* Loading dots */}
            <div className="flex gap-2 mt-4">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
        </div>
    );
};
