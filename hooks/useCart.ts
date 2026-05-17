import { useState, useEffect } from 'react';
import { CartItem, Product, User } from '../types';
import { cartAPI } from '../utils/api';

export const useCart = (user: User | null, isAdmin: boolean, products: Product[]) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('alpha_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('alpha_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync to backend when cart changes
  useEffect(() => {
    if (user && !isAdmin && products.length > 0) {
      const syncTimeout = setTimeout(async () => {
        try {
          await cartAPI.sync(cart.map(item => ({ 
            productId: item.id, 
            quantity: item.quantity,
            cartItemId: item.cartItemId,
            selectedAttributes: item.selectedAttributes
          })));
        } catch (error) {
          console.error('Cart background sync failed:', error);
        }
      }, 3000);
      return () => clearTimeout(syncTimeout);
    }
  }, [cart, user, isAdmin, products.length]);

  // Load from backend on login
  useEffect(() => {
    if (user && !isAdmin && products.length > 0) {
      const loadRemoteCart = async () => {
        try {
          const remoteCart = await cartAPI.get().catch(() => ({ items: [] }));
          if (remoteCart.items?.length > 0) {
            const cartItems = remoteCart.items.map((ri: any) => {
              const product = products.find(p => String(p.id) === String(ri.productId));
              if (!product) return null;
              
              return { 
                ...product, 
                quantity: ri.quantity,
                cartItemId: ri.cartItemId || `${product.id}-`,
                selectedAttributes: ri.selectedAttributes || {}
              };
            }).filter(Boolean);
            if (cartItems.length > 0) setCart(cartItems as CartItem[]);
          }
        } catch (error) {
          console.error('Failed to load remote cart:', error);
        }
      };
      loadRemoteCart();
    }
  }, [user?.uid, isAdmin, products.length > 0]);

  const addToCart = (product: Product, selectedAttributes?: Record<string, string>) => {
    const attrString = selectedAttributes
      ? Object.entries(selectedAttributes).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}:${v}`).join('|')
      : '';
    const cartItemId = `${product.id}-${attrString}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prev, {
        ...product,
        quantity: 1,
        selectedAttributes: selectedAttributes || {},
        cartItemId
      }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  return {
    cart,
    setCart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateCartQuantity: updateQuantity,
    clearCart
  };
};
