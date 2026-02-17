
import React, { useState, useEffect } from 'react';
import { HeroSlide, Product } from '../types';

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
        <div key={currentSlide.id} className="absolute inset-0 flex items-center p-6 md:p-16 z-20 animate-fade-in">
          <div className="max-w-xl space-y-4 md:space-y-8">
            <div className="flex flex-col gap-2 md:gap-4">
              <span className="bg-white/95 dark:bg-accent/20 backdrop-blur-md text-primary dark:text-accent text-[9px] md:text-sm font-black px-3 py-1 md:px-5 md:py-2 rounded-xl uppercase tracking-[0.2em] shadow-sm w-fit">
                {currentSlide.badge}
              </span>
              <h2 className="text-3xl md:text-7xl font-black text-gray-900 dark:text-white leading-[1.05] tracking-tighter whitespace-pre-line">
                {currentSlide.title}
              </h2>
            </div>

            <p className="text-base md:text-2xl text-gray-600 dark:text-gray-300 font-medium max-w-sm md:max-w-md">
              Discover the future of professional dental care.
            </p>

            <div className="flex gap-4">
              <button
                onClick={onShopClick}
                className="bg-primary text-white px-6 py-3 md:px-12 md:py-5 rounded-2xl font-black hover:bg-primary-dark transition-all shadow-xl shadow-primary/30 text-xs md:text-xl active:scale-95 flex items-center gap-2"
              >
                Shop Now
                <i className="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Image - Improved placement and blend */}
        <img
          key={`img-${currentSlide.id}`}
          alt={currentSlide.title}
          className="absolute right-[-15%] md:right-0 top-0 h-full w-full md:w-2/3 object-contain object-right opacity-100 group-hover:scale-105 transition-transform duration-[3000ms] z-15 p-4 md:p-12"
          src={currentSlide.image}
        />

        {/* Premium Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent pointer-events-none z-10`}></div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/40 via-transparent to-transparent z-10 lg:hidden"></div>

        {/* Modern Dots */}
        <div className="absolute bottom-6 left-10 flex gap-1.5 z-30">
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

