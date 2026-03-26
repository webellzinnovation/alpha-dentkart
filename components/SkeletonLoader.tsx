import React from 'react';

export const SkeletonLoader: React.FC<{ type?: 'card' | 'hero' | 'table' | 'list'; count?: number }> = ({ type = 'card', count = 8 }) => {
  if (type === 'hero') {
    return (
      <div className="animate-pulse">
        <div className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 h-96 rounded-2xl"></div>
        <div className="mt-6 flex gap-4">
          <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-lg">
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-lg">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: Card skeleton
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-200 dark:bg-gray-700 h-48"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="bg-gray-200 dark:bg-gray-700 h-48"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export const CategorySkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-xl animate-pulse">
    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </div>
  </div>
);

export const OrderRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white dark:bg-surface-dark rounded-lg animate-pulse">
    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full ml-auto"></div>
  </div>
);

export default SkeletonLoader;
