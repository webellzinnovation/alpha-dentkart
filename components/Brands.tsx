
import React from 'react';
import { BrandProfile } from '../types';

interface BrandsProps {
  onBrandClick: (brandName: string) => void;
  brands: BrandProfile[];
}

export const Brands: React.FC<BrandsProps> = ({ onBrandClick, brands }) => {
  if (!brands || brands.length === 0) return null;

  return (
    <div className="py-8">
      {/* Hero/Title */}
      <div className="text-center mb-12">
        <span className="text-primary font-bold tracking-wider text-sm uppercase">World Class Quality</span>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4 mt-2">Our Premium Brands</h1>
        <p className="text-gray-500 max-w-2xl mx-auto dark:text-gray-400">We partner with the world's leading dental manufacturers to bring you quality, reliability, and innovation for your practice.</p>
      </div>

      {/* Grid */}
      {brands && brands.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brands.map(brand => (
            <div key={brand.id}
              onClick={() => onBrandClick(brand.name)}
              className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className="w-32 h-32 mb-6 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-full group-hover:scale-110 transition-transform duration-300">
                <img src={brand.logo} alt={brand.name} className="max-w-[70%] max-h-[70%] object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{brand.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 h-10">{brand.description}</p>
              <button className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
                View {brand.productCount} Products
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <i className="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 dark:text-gray-400">No brands available at the moment.</p>
        </div>
      )}
    </div>
  );
};
