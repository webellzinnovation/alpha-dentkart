import React from 'react';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
    showProgress?: boolean;
    progress?: number;
    error?: string | null;
    onRetry?: () => void;
}

export const Loading: React.FC<LoadingProps> = ({ 
    message = 'Loading...', 
    fullScreen = false,
    showProgress = false,
    progress = 0,
    error = null,
    onRetry
}) => {
    const containerClass = fullScreen
        ? 'fixed inset-0 bg-white dark:bg-surface-dark flex flex-col items-center justify-center z-50 p-6'
        : 'flex flex-col items-center justify-center py-20 p-6';

    if (error) {
        return (
            <div className={containerClass}>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md w-full text-center shadow-xl animate-scale-in">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Issue</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-sync-alt"></i> Try Again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClass}>
            {/* Logo */}
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative animate-bounce">
                    <img
                        src="/Alpha-dentkart-logo-600p.png"
                        alt="Alpha DentKart"
                        className="h-24 object-contain"
                    />
                </div>
            </div>

            {/* Loading text */}
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{message}</h2>
            
            {showProgress ? (
                <div className="w-full max-w-xs space-y-3">
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div 
                            className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 rounded-full shadow-sm shadow-primary/30"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium uppercase tracking-wider">
                        {progress}% Completed
                    </p>
                </div>
            ) : (
                <div className="flex gap-2 mt-2">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            )}
            
            <p className="mt-8 text-sm text-gray-400 dark:text-gray-500 italic">This usually takes only a few seconds...</p>
        </div>
    );
};
