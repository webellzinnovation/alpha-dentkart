import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import OptimizedImageMemo from './OptimizedImage';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, attributes?: Record<string, string>) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentOriginalPrice, setCurrentOriginalPrice] = useState<number | undefined>(undefined);
  const [selectedImage, setSelectedImage] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelectedImage(product.image);
      
      // Initialize attributes
      if (product.attributes) {
        const defaults: Record<string, string> = {};
        product.attributes.forEach(attr => {
          defaults[attr.name] = attr.options[0];
        });
        setSelectedAttributes(defaults);
      } else {
        setSelectedAttributes({});
      }
      
      setCurrentPrice(product.price);
      setCurrentOriginalPrice(product.originalPrice);
    }
  }, [isOpen, product]);

  // Handle price/image updates based on attributes
  useEffect(() => {
    if (!product || !product.variations || product.variations.length === 0) return;

    const matchedVariation = product.variations.find(v => {
      return Object.entries(v.attributes).every(([key, value]) => selectedAttributes[key] === value);
    });

    if (matchedVariation) {
      if (matchedVariation.price) setCurrentPrice(matchedVariation.price);
      if (matchedVariation.originalPrice) setCurrentOriginalPrice(matchedVariation.originalPrice);
    } else {
      setCurrentPrice(product.price);
      setCurrentOriginalPrice(product.originalPrice);
    }
  }, [selectedAttributes, product]);

  if (!isOpen || !product) return null;

  const handleAttributeSelect = (name: string, value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
        const productToAdd = { ...product, price: currentPrice, originalPrice: currentOriginalPrice };
        onAddToCart(productToAdd, product.attributes ? selectedAttributes : undefined);
    }
    onClose();
  };

  const images = product.images || [product.image, product.image];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl animate-fade-in flex flex-col md:flex-row overflow-hidden">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Left: Images */}
        <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800 p-8 flex flex-col items-center justify-center gap-4">
          <div className="w-full h-64 flex items-center justify-center">
             <OptimizedImageMemo 
               src={selectedImage} 
               alt={product.name} 
               className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
               width={400}
               height={400}
             />
          </div>
          <div className="flex gap-2 overflow-x-auto max-w-full pb-2 scrollbar-hide">
            {images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-16 border rounded-lg p-1 bg-white dark:bg-gray-700 flex-shrink-0 ${selectedImage === img ? 'border-primary' : 'border-transparent'}`}
              >
                <OptimizedImageMemo src={img} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="" width={64} height={64} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-8 flex flex-col">
          <div className="mb-1 text-xs font-bold text-primary uppercase tracking-wider">{product.category}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h2>
          
          <div className="flex items-center gap-2 mb-4">
             <div className="flex text-yellow-400 text-xs">
               {[...Array(5)].map((_, i) => (
                 <i key={i} className={`${i < Math.floor(product.rating) ? 'fas' : (i < product.rating ? 'fas fa-star-half-alt' : 'far')} fa-star`}></i>
               ))}
             </div>
             <span className="text-xs text-gray-500">({product.reviews || 0} reviews)</span>
          </div>

          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">₹{(currentPrice ?? 0).toLocaleString('en-IN')}</span>
            {currentOriginalPrice && (
              <span className="text-lg text-gray-400 line-through mb-1">₹{(currentOriginalPrice ?? 0).toLocaleString('en-IN')}</span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
            {product.description ? product.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : ''}
          </p>

          {/* Attributes */}
          {product.attributes && (
            <div className="space-y-4 mb-6">
               {product.attributes.map(attr => (
                 <div key={attr.name}>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 block">
                      {attr.name}: <span className="text-primary font-normal">{selectedAttributes[attr.name]}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map(option => (
                        <button
                          key={option}
                          onClick={() => handleAttributeSelect(attr.name, option)}
                          className={`px-3 py-1.5 text-xs rounded border transition-all ${
                            selectedAttributes[attr.name] === option 
                            ? 'bg-primary text-white border-primary' 
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

          <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
             <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg w-max">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                >
                  <i className="fas fa-minus text-xs"></i>
                </button>
                <span className="w-10 text-center font-bold text-gray-800 dark:text-white">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                >
                  <i className="fas fa-plus text-xs"></i>
                </button>
             </div>
             <button 
               onClick={handleAddToCart}
               className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-pink-700 transition-colors shadow-lg shadow-primary/25"
             >
               Add to Cart
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};