import React, { useState, useRef, useEffect, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean; // For critical above-the-fold images
  sizes?: string; // For responsive images
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number; // 1-100
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  sizes = '100vw',
  placeholder = '/placeholder-image.png',
  fallback = '/fallback-image.png',
  onLoad,
  onError,
  quality = 80,
  format = 'auto'
}) => {
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  
  // Generate optimized URL once
  const optimizedUrl = React.useMemo(() => {
    if (import.meta.env.DEV) return src;
    
    const url = new URL(src, window.location.origin);
    if (format !== 'auto') {
      url.searchParams.set('format', format);
    }
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('auto', 'compress');
    
    return url.toString();
  }, [src, quality, format]);

  const [currentSrc, setCurrentSrc] = useState(priority ? optimizedUrl : placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Generate optimized image URL (in production, this would use CDN)
  const generateOptimizedUrl = useCallback((originalSrc: string) => {
    if (import.meta.env.DEV) return originalSrc;
    
    // In production, this would generate CDN URLs with parameters
    const url = new URL(originalSrc, window.location.origin);
    
    if (format !== 'auto') {
      url.searchParams.set('format', format);
    }
    
    url.searchParams.set('quality', quality.toString());
    url.searchParams.set('auto', 'compress');
    
    return url.toString();
  }, [quality, format]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority]);

  // Load optimized image when in view
  useEffect(() => {
    if (priority || !isInView || isLoaded || hasError) return;

    const img = new Image();
    img.onload = () => {
      setCurrentSrc(optimizedUrl);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setCurrentSrc(fallback);
      setHasError(true);
      onError?.();
    };

    img.src = optimizedUrl;
  }, [isInView, isLoaded, hasError, optimizedUrl, onLoad, onError, fallback, priority]);

  // Generate srcset for responsive images
  const generateSrcSet = useCallback(() => {
    if (import.meta.env.DEV) return undefined;

    const sizes = [320, 640, 768, 1024, 1280, 1536];
    return sizes
      .map(size => {
        const url = new URL(src, window.location.origin);
        url.searchParams.set('w', size.toString());
        url.searchParams.set('quality', quality.toString());
        return `${url.toString()} ${size}w`;
      })
      .join(', ');
  }, [src, quality]);

  return (
    <div className={`${className} relative overflow-hidden`}>
      {/* Placeholder with blur effect */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          style={{
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={generateSrcSet()}
        loading={priority ? 'eager' : 'lazy'}
        // @ts-ignore - fetchpriority is a valid HTML attribute but not yet in all React types
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={`
          transition-opacity duration-300 ease-in-out
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          w-full h-full
        `}
        style={{
          objectFit: (className.includes('object-contain') ? 'contain' : 'cover') as any,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-center p-4">
            <i className="fas fa-image-slash text-3xl text-gray-400 mb-2"></i>
            <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load image</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const OptimizedImageMemo = React.memo(OptimizedImage);
export default OptimizedImageMemo;