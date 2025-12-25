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
            {/* Animated Logo */}
            <div className="relative w-24 h-24 mb-6">
                {/* Pulsing background circle */}
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>

                {/* Logo container with rotation */}
                <div className="relative w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg animate-pulse overflow-hidden">
                    <img
                        src="/Alpha-dentkart-logo-icon.png"
                        alt="Alpha Dentkart"
                        className="w-16 h-16 object-contain"
                    />
                </div>

                {/* Spinning border */}
                <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
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
