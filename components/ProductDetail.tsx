
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { DeliveryEstimator } from './DeliveryEstimator';
import { Helmet } from 'react-helmet-async';
import { WriteReviewModal } from './WriteReviewModal';
import ReviewDisplay from './ReviewDisplay';
import { reviewsAPI } from '../utils/api';
import { Review } from '../types';
import OptimizedImageMemo from './OptimizedImage';


const stripHtml = (html: string) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

interface ProductDetailProps {
  product: Product;
  allProducts: Product[]; // New prop to pass the dynamic list
  onAddToCart: (product: Product, attributes?: Record<string, string>) => void;
  onToggleWishlist: (product: Product) => void;
  isInWishlist: boolean;
  onProductClick: (product: Product) => void;
  onNavigateBack: () => void;
  onCategoryClick: (category: string) => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  allProducts,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  onProductClick,
  onNavigateBack,
  onCategoryClick,
  onQuickView
}) => {
  console.log("Rendering ProductDetail for:", product?.name, product?.id);

  if (!product) {
    console.error("ProductDetail rendered without product!");
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <i className="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Product Not Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This product is currently unavailable or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Attribute State
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [currentOriginalPrice, setCurrentOriginalPrice] = useState(product.originalPrice);

  const [openSections, setOpenSections] = useState({
    description: true,
    specs: false,
    reviews: false
  });
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Initialize defaults
  useEffect(() => {
    setSelectedImage(product.image);
    setCurrentImageIndex(0);
    setOpenSections({ description: true, specs: false, reviews: false });
    setQuantity(1);

    // Set default attributes (first option of each)
    if (product.attributes) {
      const defaults: Record<string, string> = {};
      product.attributes.forEach(attr => {
        if (attr.options && attr.options.length > 0) {
          defaults[attr.name] = attr.options[0];
        }
      });
      setSelectedAttributes(defaults);
    } else {
      setSelectedAttributes({});
    }

    // Scroll to top reliably on product change
    window.scrollTo(0, 0);
    const scrollTimeout = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(scrollTimeout);
  }, [product]);

  const fetchReviews = async () => {
    if (!product.id) return;
    setIsLoadingReviews(true);
    try {
      const data = await reviewsAPI.getProductReviews(product.id);
      if (data.reviews) {
        setProductReviews(data.reviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (openSections.reviews && productReviews.length === 0) {
      fetchReviews();
    }
  }, [openSections.reviews]);

  // Update price/image based on selection
  useEffect(() => {
    if (!product.variations || product.variations.length === 0) {
      setCurrentPrice(product.price);
      setCurrentOriginalPrice(product.originalPrice);
      return;
    }

    // Check if current selection matches a variation
    const matchedVariation = product.variations.find(v => {
      return Object.entries(v.attributes).every(([key, value]) => selectedAttributes[key] === value);
    });

    if (matchedVariation) {
      if (matchedVariation.price) setCurrentPrice(matchedVariation.price);
      if (matchedVariation.originalPrice) setCurrentOriginalPrice(matchedVariation.originalPrice);
      // Optional: if variation has image, set it
      // if (matchedVariation.image) setSelectedImage(matchedVariation.image);
    } else {
      setCurrentPrice(product.price);
      setCurrentOriginalPrice(product.originalPrice);
    }
  }, [selectedAttributes, product]);


  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAttributeSelect = (name: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get related products (same category, excluding current) using dynamic list
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Default images array if not present
  const images = product.images || [product.image, product.image, product.image];

  // Image navigation functions
  const goToPreviousImage = () => {
    const newIndex = currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  const goToNextImage = () => {
    const newIndex = currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentImageIndex, images]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      // Pass selected attributes if product has attributes
      const attributesToSend = product.attributes ? selectedAttributes : undefined;
      // Pass the calculated price as part of the product copy (optional, depending on if cart recalculates)
      // For simplicity, we assume app logic uses passed product object which we can override price on:
      const productToAdd = { ...product, price: currentPrice, originalPrice: currentOriginalPrice };
      onAddToCart(productToAdd, attributesToSend);
    }
  };

  const badgeColors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>{product.seoTitle || `${product.name} | Alpha Dentkart`}</title>
        <meta name="description" content={product.seoDescription || product.shortDescription || stripHtml(product.description).substring(0, 160)} />
        <meta name="keywords" content={product.seoKeywords || `${product.name}, dental supplies, ${product.category}, ${product.brand}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:title" content={product.seoTitle || product.name} />
        <meta property="og:description" content={product.seoDescription || product.shortDescription || stripHtml(product.description).substring(0, 160)} />
        <meta property="og:image" content={product.image} />
        <meta property="og:url" content={window.location.href} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.seoTitle || product.name} />
        <meta name="twitter:description" content={product.seoDescription || product.shortDescription || stripHtml(product.description).substring(0, 160)} />
        <meta name="twitter:image" content={product.image} />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": [product.image, ...(product.images || [])],
            "description": stripHtml(product.description),
            "brand": {
              "@type": "Brand",
              "name": product.brand
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "INR",
              "price": product.price,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": product.reviews || 1
            }
          })}
        </script>
      </Helmet>
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <span className="cursor-pointer hover:text-primary" onClick={() => onNavigateBack()}>Home</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="cursor-pointer hover:text-primary" onClick={() => onCategoryClick(product.category)}>{product.category}</span>
        <i className="fas fa-chevron-right text-xs"></i>
        <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[200px]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-start">
        {/* Left Column: Images (Sticky) */}
        <div className="lg:sticky lg:top-24 space-y-4 self-start">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl p-8 flex items-center justify-center h-[400px] sm:h-[500px] relative group overflow-hidden">
            {/* Main Image - Clickable for Lightbox */}
            <OptimizedImageMemo
              src={selectedImage}
              alt={product.name}
              onClick={() => setIsLightboxOpen(true)}
              className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500 cursor-pointer"
              width={600}
              height={600}
              priority={true}
            />

            {/* Badge */}
            {product.badge && (
              <span className={`absolute top-4 left-4 text-white text-xs font-bold px-3 py-1 rounded-full z-10 ${badgeColors[product.badgeColor || 'blue']}`}>
                {product.badge}
              </span>
            )}

            {/* Navigation Arrows - Show on hover (desktop) or always (mobile) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg opacity-0 group-hover:opacity-100 lg:opacity-100 z-20"
                  aria-label="Previous image"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center text-gray-800 dark:text-white hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg opacity-0 group-hover:opacity-100 lg:opacity-100 z-20"
                  aria-label="Next image"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedImage(img);
                  setCurrentImageIndex(idx);
                }}
                className={`w-20 h-20 flex-shrink-0 bg-white dark:bg-surface-dark border rounded-xl p-2 flex items-center justify-center transition-all ${currentImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700 hover:border-primary'}`}
              >
                <OptimizedImageMemo src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" width={100} height={100} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Info & Accordions */}
        <div className="flex flex-col h-full">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">{product.name}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
            <div className="flex items-center gap-1">
              <div className="flex text-yellow-400 text-sm">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className={`${i < Math.floor(product.rating) ? 'fas' : (i < product.rating ? 'fas fa-star-half-alt' : 'far')} fa-star`}></i>
                ))}
              </div>
              <span className="text-sm text-gray-500 ml-1">{product.rating} ({product.reviews || 0} reviews)</span>
            </div>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full w-fit">{product.brand}</span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="text-sm text-green-600 font-medium flex items-center gap-1"><i className="fas fa-check-circle"></i> In Stock</span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-4xl font-bold text-primary">₹{(currentPrice || 0).toLocaleString('en-IN')}</span>
            {currentOriginalPrice && (
              <span className="text-xl text-gray-400 line-through mb-1">₹{(currentOriginalPrice ?? 0).toLocaleString('en-IN')}</span>
            )}
            {currentOriginalPrice && (
              <span className="text-sm font-bold text-green-600 mb-2 ml-2">
                {Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Variations/Attributes Selector */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mb-8 space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
              {product.attributes.map(attr => (
                <div key={attr.name}>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                    {attr.name}: <span className="text-primary font-normal">{selectedAttributes[attr.name]}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {attr.options.map(option => (
                      <button
                        key={option}
                        onClick={() => handleAttributeSelect(attr.name, option)}
                        className={`px-4 py-2 text-sm rounded-lg border transition-all ${selectedAttributes[attr.name] === option
                          ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-primary/50'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg w-max bg-white dark:bg-surface-dark">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
              >
                <i className="fas fa-minus text-xs"></i>
              </button>
              <span className="w-12 text-center font-bold text-gray-800 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
              >
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-pink-700 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              <i className="fas fa-shopping-cart"></i> Add to Cart
            </button>
            <button
              onClick={() => onToggleWishlist(product)}
              className={`w-12 h-12 sm:w-14 sm:h-auto rounded-lg border flex items-center justify-center transition-colors bg-white dark:bg-surface-dark ${isInWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary'}`}
            >
              <i className={`${isInWishlist ? 'fas' : 'far'} fa-heart text-xl`}></i>
            </button>
          </div>

          {/* Service Badges */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <i className="fas fa-truck text-primary"></i>
              <span>Free Delivery over ₹2000</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-shield-alt text-primary"></i>
              <span>2 Year Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-undo text-primary"></i>
              <span>7 Days Return Policy</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-headset text-primary"></i>
              <span>24/7 Expert Support</span>
            </div>
          </div>

          {/* Delivery Estimator */}
          <DeliveryEstimator />

          {/* Accordion Sections */}
          <div className="space-y-2">

            {/* Description Accordion */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('description')}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 relative"
              >
                <span className="font-bold text-gray-800 dark:text-white">Description & Features</span>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${openSections.description ? 'rotate-180 text-primary' : 'text-gray-400'}`}></i>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openSections.description ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="p-6 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700">
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      <div className="mb-4 whitespace-pre-line">
                        {product.description ? (
                          stripHtml(product.description)
                            .replace(/(\s+)(Indications?:|Features?:|Composition:|Key Specifications?|Technical Datu|Curing Time:|Depth of Cure:|Compressive Strength:|Flexural Strength:|Storage Conditions?|Shelf Life)/gi, '\n\n$2')
                            .replace(/(Of anterior and posterior teeth)(\s+)([A-Z])/g, '$1\n\n$3')
                            .replace(/(\s+)(•)/g, '\n$2')
                            .replace(/\n{3,}/g, '\n\n')
                            .trim()
                        ) : (
                          "No detailed description available."
                        )}
                      </div>
                      {product.features && (
                        <div className="mt-4">
                          <h5 className="font-bold text-gray-800 dark:text-white mb-2">Key Features:</h5>
                          <ul className="space-y-2 list-none pl-0">
                            {product.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <i className="fas fa-check-circle text-primary mt-1 text-xs"></i>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Specs Accordion */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('specs')}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 relative"
              >
                <span className="font-bold text-gray-800 dark:text-white">Specifications</span>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${openSections.specs ? 'rotate-180 text-primary' : 'text-gray-400'}`}></i>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openSections.specs ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="p-6 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700">
                    {product.specs ? (
                      <div className="grid grid-cols-1 gap-y-3">
                        {Object.entries(product.specs)
                          .filter(([key]) => {
                            const normalizedKey = key.toLowerCase();
                            if (normalizedKey === 'managestock' || normalizedKey === 'manage_stock') return false;
                            
                            const hasCapitalized = Object.keys(product.specs).some(
                              k => k !== key && k.toLowerCase() === normalizedKey && k[0] === k[0].toUpperCase()
                            );
                            if (hasCapitalized && key !== key.toUpperCase() && key[0] !== key[0].toUpperCase()) {
                              return false;
                            }
                            return true;
                          })
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{key}</span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {typeof value === 'object' && value !== null ? (
                                  ('length' in value || 'width' in value || 'height' in value) ? (
                                    `${(value as any).length || 0} x ${(value as any).width || 0} x ${(value as any).height || 0}`
                                  ) : Array.isArray(value) ? (
                                    value.join(', ')
                                  ) : (
                                    JSON.stringify(value)
                                  )
                                ) : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No specifications available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Accordion */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('reviews')}
                className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 relative"
              >
                <span className="font-bold text-gray-800 dark:text-white">Reviews ({product.reviews || 0})</span>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${openSections.reviews ? 'rotate-180 text-primary' : 'text-gray-400'}`}></i>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openSections.reviews ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <div className="p-4 md:p-8 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700">
                    {isLoadingReviews ? (
                      <div className="flex justify-center py-8">
                        <i className="fas fa-spinner fa-spin text-primary text-2xl"></i>
                      </div>
                    ) : (
                      <ReviewDisplay 
                        productId={product.id} 
                        reviews={productReviews}
                        onWriteReview={() => setIsReviewModalOpen(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">You Might Also Like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                compact={true}
                onProductClick={onProductClick}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onQuickView={onQuickView}
                isInWishlist={p.id === product.id ? isInWishlist : false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-50"
            aria-label="Close lightbox"
          >
            <i className="fas fa-times text-xl"></i>
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large Image */}
            <OptimizedImageMemo
              src={selectedImage}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain"
              width={1200}
              height={1200}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Previous image"
                >
                  <i className="fas fa-chevron-left text-xl"></i>
                </button>
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Next image"
                >
                  <i className="fas fa-chevron-right text-xl"></i>
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
      {/* Review Modal */}
      {isReviewModalOpen && (
        <WriteReviewModal
          productId={product.id}
          productName={product.name}
          onClose={() => setIsReviewModalOpen(false)}
          onSuccess={() => {
            setIsReviewModalOpen(false);
            alert('Review submitted successfully! It will be visible after approval.');
          }}
        />
      )}
    </div>
  );
};

export default ProductDetail;
