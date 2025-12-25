
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
        className={`w-full ${currentSlide.bgClass} rounded-2xl overflow-hidden relative group h-[350px] md:h-[500px] transition-all duration-700 shadow-sm ${currentSlide.link ? 'cursor-pointer' : ''}`}
        onClick={currentSlide.link ? handleSlideClick : undefined}
      >
        <div key={currentSlide.id} className="absolute inset-0 flex items-center justify-between p-6 md:p-12 z-20 animate-fade-in">
          <div className="max-w-xl space-y-3 md:space-y-6">
            <span className="bg-white/90 dark:bg-black/50 backdrop-blur-sm text-primary dark:text-white text-[10px] md:text-sm font-bold px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg uppercase tracking-wider shadow-sm border border-white/20">
              {currentSlide.badge}
            </span>
            <h2 className="text-3xl md:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight drop-shadow-sm whitespace-pre-line">
              {currentSlide.title}
            </h2>
            <p className="text-lg md:text-2xl text-primary font-bold">{currentSlide.subtitle}</p>
            <div className="flex gap-3 md:gap-4 mt-4">
              <button
                onClick={onShopClick}
                className="bg-primary text-white px-5 py-2.5 md:px-10 md:py-4 rounded-xl font-bold hover:bg-pink-700 transition-all shadow-lg shadow-primary/30 text-xs md:text-lg active:scale-95"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>

        {/* Image */}
        <img
          key={`img-${currentSlide.id}`}
          alt={currentSlide.title}
          className="absolute right-[-10%] md:right-0 top-0 h-full w-[80%] md:w-2/3 object-cover object-center md:object-left opacity-90 group-hover:scale-105 transition-transform duration-[2000ms] mask-image-gradient"
          src={currentSlide.image}
        />

        {/* Gradients */}
        <div className={`absolute inset-0 bg-gradient-to-r ${currentSlide.gradientClass} to-transparent dark:from-gray-900 dark:via-gray-900/80 dark:to-transparent pointer-events-none transition-all duration-500 z-10`}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-gray-900 dark:via-transparent z-10 lg:hidden"></div>

        {/* Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all z-30 group/btn border border-white/20"
        >
          <i className="fas fa-chevron-left text-gray-800 dark:text-white group-hover/btn:text-primary text-xs md:text-base"></i>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-black transition-all z-30 group/btn border border-white/20"
        >
          <i className="fas fa-chevron-right text-gray-800 dark:text-white group-hover/btn:text-primary text-xs md:text-base"></i>
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {slides.map((_, index) => (
            <div
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 rounded-full cursor-pointer transition-all duration-300 shadow-sm ${index === currentSlideIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-300/80 dark:bg-gray-600 hover:bg-primary'}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
