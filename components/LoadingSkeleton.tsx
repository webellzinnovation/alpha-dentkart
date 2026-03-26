import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 mb-4"></div>
      
      {/* Hero skeleton */}
      <div className="h-[400px] md:h-[500px] bg-gray-200 dark:bg-gray-700 mx-4 mb-8 rounded-2xl"></div>
      
      {/* Categories skeleton */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
          ))}
        </div>
      </div>
      
      {/* Products skeleton */}
      <div className="container mx-auto px-4">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

export const DetailPageSkeleton: React.FC = () => (
  <div className="container mx-auto px-4 py-8 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image skeleton */}
      <div>
        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
      
      {/* Details skeleton */}
      <div>
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="space-y-2 mb-6">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  </div>
);
