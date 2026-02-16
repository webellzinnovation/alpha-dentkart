
import React from 'react';
import { Category } from '../types';

interface CategoriesProps {
  onCategoryClick: (categoryName: string) => void;
  categories: Category[];
}

export const Categories: React.FC<CategoriesProps> = ({ onCategoryClick, categories }) => {
  return (
    <div className="py-8 animate-fade-in">
       <div className="text-center mb-12">
         <span className="text-primary font-bold tracking-wider text-sm uppercase">Shop By Department</span>
         <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4 mt-2">Browse Categories</h1>
         <p className="text-gray-500 max-w-2xl mx-auto dark:text-gray-400">Explore our extensive range of dental supplies organized for your convenience.</p>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
         {categories.map(cat => (
           <div key={cat.id} 
                onClick={() => onCategoryClick(cat.name)}
                className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
           >
              <div className="w-24 h-24 mb-6 flex items-center justify-center bg-primary/5 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-300 overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <i className={`${cat.iconClass || 'fas fa-tooth'} text-4xl text-primary group-hover:text-white transition-colors`}></i>
                )}
              </div>
             <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{cat.name}</h3>
             <button className="text-sm font-semibold text-gray-500 group-hover:text-primary transition-colors mt-2 flex items-center gap-1">
               Explore Products <i className="fas fa-arrow-right text-xs"></i>
             </button>
           </div>
         ))}
       </div>
    </div>
  );
};
