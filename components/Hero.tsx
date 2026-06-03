
import React, { useState, useEffect } from 'react';
import { HeroSlide, Product } from '../types';
import OptimizedImageMemo from './OptimizedImage';


interface HeroProps {
  onShopClick: () => void;
  onProductClick?: (product: Product) => void;
  onCategoryClick?: (category: string) => void;
  onBrandClick?: (brand: string) => void;
  products?: Product[];
  slides: HeroSlide[];
}

export const Hero: React.FC<HeroProps> = ({ onShopClick, onProductClick, onCategoryClick, onBrandClick, products = [], slides }) => {
  if (!slides || slides.length === 0) return null;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const handleSlideClick = () => {
    const slide = slides[currentSlideIndex];
    if (slide.link) {
      switch (slide.link.type) {
        case 'product':
          const product = products.find(p => p.id === slide.link!.value);
          if (product && onProductClick) {
            onProductClick(product);
          }
          break;
        case 'category':
          if (onCategoryClick) {
            onCategoryClick(slide.link.value as string);
          }
          break;
        case 'brand':
          if (onBrandClick) {
            onBrandClick(slide.link.value as string);
          }
          break;
        case 'url':
          window.location.href = slide.link.value as string;
          break;
      }
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="w-full">
      <div
        className={`w-full ${currentSlide.bgClass} rounded-[2rem] overflow-hidden relative group h-[300px] md:h-[500px] transition-all duration-700 shadow-premium ${currentSlide.link ? 'cursor-pointer' : ''}`}
        onClick={currentSlide.link ? handleSlideClick : undefined}
      >
        <div key={currentSlide.id} className="absolute inset-0 flex flex-col md:flex-row items-start md:items-center px-6 md:px-16 z-30 animate-fade-in">
          {/* Text Content - Left Side */}
          <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3 md:space-y-8 pt-8 md:pt-0 z-30 relative max-w-[70%] md:max-w-none">
            <div className="flex flex-col gap-1.5 md:gap-4">
              <span className="bg-white/95 dark:bg-accent/20 backdrop-blur-md text-primary dark:text-accent text-[8px] md:text-sm font-black px-2.5 py-1 md:px-5 md:py-2 rounded-xl uppercase tracking-[0.2em] shadow-sm w-fit">
                {currentSlide.badge}
              </span>
              <h2 className="text-xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tighter whitespace-pre-line">
                {currentSlide.title}
              </h2>
            </div>

            <p className="text-[10px] md:text-2xl text-gray-600 dark:text-gray-300 font-medium max-w-[180px] md:max-w-md leading-relaxed">
              Discover the future of professional dental care.
            </p>

            <div className="flex gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); onShopClick(); }}
                className="bg-primary text-white px-4 py-2.5 md:px-12 md:py-5 rounded-xl md:rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 text-[10px] md:text-xl active:scale-95 flex items-center gap-1.5 w-fit"
              >
                Shop Now
                <i className="fas fa-arrow-right text-[8px] md:text-[10px]"></i>
              </button>
            </div>
          </div>

          {/* Image Content - Right Side */}
          <div className="absolute right-2 bottom-4 w-[45%] h-[60%] md:relative md:right-0 md:bottom-0 md:w-1/2 md:h-full flex items-center justify-end z-10 pointer-events-none md:pointer-events-auto">
            <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-[3000ms] flex items-center justify-end">
              <OptimizedImageMemo
                key={`img-${currentSlide.id}`}
                alt={currentSlide.title}
                className="w-full h-full object-contain object-right-bottom p-1 md:p-12"
                src={currentSlide.image}
                priority={true}
                width={600}
                height={500}
              />
            </div>
          </div>
        </div>

        {/* Premium Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent pointer-events-none z-20`}></div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/40 via-transparent to-transparent z-20 lg:hidden"></div>

        {/* Modern Dots */}
        <div className="absolute bottom-6 left-10 flex gap-1.5 z-50">
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              className={`h-1.5 rounded-full cursor-pointer transition-all duration-500 ${index === currentSlideIndex ? 'w-8 bg-primary shadow-sm shadow-primary/50' : 'w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

