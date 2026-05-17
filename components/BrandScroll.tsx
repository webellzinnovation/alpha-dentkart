
import React from 'react';
import { BrandProfile } from '../types';
import OptimizedImageMemo from './OptimizedImage';

interface BrandScrollProps {
  onBrandClick: (brandName: string) => void;
  brands: BrandProfile[];
}

export const BrandScroll: React.FC<BrandScrollProps> = ({ onBrandClick, brands }) => {
  return (
    <section className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 py-5 shadow-sm overflow-hidden relative">
      {/* Gradient Masks for smooth fade out at edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 dark:from-surface-dark pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 dark:from-surface-dark pointer-events-none"></div>

      <div className="flex w-max animate-infinite-scroll hover-pause">
        {/* First Set */}
        <div className="flex items-center gap-8 md:gap-16 px-4 md:px-8">
          {brands.map((brand) => (
            <button 
              key={`brand-1-${brand.id}`} 
              onClick={() => onBrandClick(brand.name)}
              className="flex-shrink-0 group flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer focus:outline-none grayscale hover:grayscale-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-1">
                <OptimizedImageMemo 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                />
              </div>
              <span className="font-bold text-lg text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors tracking-tight whitespace-nowrap">{brand.name}</span>
            </button>
          ))}
        </div>
        {/* Second Set (Duplicate for loop) */}
        <div className="flex items-center gap-8 md:gap-16 px-4 md:px-8">
          {brands.map((brand) => (
            <button 
              key={`brand-2-${brand.id}`} 
              onClick={() => onBrandClick(brand.name)}
              className="flex-shrink-0 group flex items-center gap-3 opacity-60 hover:opacity-100 transition-all duration-300 cursor-pointer focus:outline-none grayscale hover:grayscale-0"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-1">
                 <OptimizedImageMemo 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                />
              </div>
              <span className="font-bold text-lg text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors tracking-tight whitespace-nowrap">{brand.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
