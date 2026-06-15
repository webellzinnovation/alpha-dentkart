import React, { useState, useRef, useEffect } from 'react';
import { resolveProductImage } from '../utils/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  sizes?: string;
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

const FALLBACK_SRC = '/Alpha-dentkart-logo-600p.png';

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 50vw',
  fallback = FALLBACK_SRC,
  onLoad,
  onError,
  onClick,
}) => {
  // Always resolve to a safe HTTPS URL via the central helper
  const resolvedSrc = resolveProductImage(src);

  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Re-resolve whenever src changes (e.g. product list changes)
  useEffect(() => {
    const next = resolveProductImage(src);
    if (next !== currentSrc) {
      setCurrentSrc(next);
      setIsLoaded(false);
      setHasError(false);
    }
  }, [src]);

  // Handle cached images that complete loading before React binds onload listener
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
      setHasError(false);
    }
  }, [currentSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    if (currentSrc !== fallback) {
      setCurrentSrc(fallback);
    } else {
      setHasError(true);
    }
    onError?.();
  };

  const isContain = className.includes('object-contain');

  return (
    <div 
      className={`${className} relative overflow-hidden ${isContain ? 'flex items-center justify-center' : ''}`} 
      onClick={onClick}
    >
      {/* Skeleton shimmer while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
      )}

      {/* Main image — use native lazy loading for best performance */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // @ts-ignore
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ease-in-out ${
          isContain ? 'max-w-full max-h-full object-contain' : 'w-full h-full object-cover'
        } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <i className="fas fa-image text-3xl text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const OptimizedImageMemo = React.memo(OptimizedImage);
export default OptimizedImageMemo;