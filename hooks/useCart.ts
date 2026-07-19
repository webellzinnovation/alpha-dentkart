import { useState, useEffect, useRef, useCallback } from 'react';
import { CartItem, Product, User } from '../types';
import { cartAPI } from '../utils/api';

export const useCart = (user: User | null, isAdmin: boolean, products: Product[]) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('alpha_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;
  
  const prevUserIdRef = useRef<string | null>(null);
  const userId = user?.id ?? null;

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('alpha_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync to backend when cart changes (debounced 3s)
  useEffect(() => {
    if (user && !isAdmin && products.length > 0 && hasLoadedRemote) {
      const syncTimeout = setTimeout(async () => {
        try {
          await cartAPI.sync(cartRef.current.map(item => ({
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
  }, [cart, userId, isAdmin, products.length, hasLoadedRemote]);

  // Load from backend on login & tab focus
  useEffect(() => {
    if (isAdmin || products.length === 0) return;

    // Handle logout or user switch cleanup
    if (!userId) {
      if (prevUserIdRef.current !== null) {
        setCart([]);
        localStorage.removeItem('alpha_cart');
        setHasLoadedRemote(false);
        prevUserIdRef.current = null;
      }
      return;
    }

    // If switching between different authenticated users, don't merge - just reset first
    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      setCart([]);
      localStorage.removeItem('alpha_cart');
      setHasLoadedRemote(false);
    }

    let cancelled = false;
    const loadRemoteCart = async () => {
      try {
        const remoteCart = await cartAPI.get().catch(() => ({ items: [] }));
        if (cancelled) return;

        const localCart = cartRef.current;
        const remoteItems = remoteCart.items || [];
        const remoteCartMapped = remoteItems.map((ri: any) => {
          const product = products.find(p => String(p.id) === String(ri.productId));
          if (!product) return null;

          return {
            ...product,
            quantity: ri.quantity,
            cartItemId: ri.cartItemId || `${product.id}-`,
            selectedAttributes: ri.selectedAttributes || {}
          };
        }).filter(Boolean);

        let merged = [...remoteCartMapped];

        // Transitioning from guest (null) to logged-in user: merge local guest items
        if (!prevUserIdRef.current && localCart.length > 0) {
          localCart.forEach((lc) => {
            const idx = merged.findIndex(item => item.cartItemId === lc.cartItemId);
            if (idx > -1) {
              merged[idx].quantity = Math.max(merged[idx].quantity, lc.quantity);
            } else {
              merged.push(lc);
            }
          });

          // Sync merged cart to server immediately
          await cartAPI.sync(merged.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            cartItemId: item.cartItemId,
            selectedAttributes: item.selectedAttributes
          }))).catch(err => console.error('Merged cart sync failed:', err));
        }

        if (!cancelled) {
          setCart(merged);
          setHasLoadedRemote(true);
          prevUserIdRef.current = userId;
        }
      } catch (error) {
        console.error('Failed to load remote cart:', error);
      }
    };
    loadRemoteCart();

    return () => { cancelled = true; };
  }, [userId, isAdmin, products.length]);

  // Re-fetch remote cart when tab regains focus (cross-device sync)
  useEffect(() => {
    if (!userId || isAdmin) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || products.length === 0) return;

      try {
        const remoteCart = await cartAPI.get().catch(() => ({ items: [] }));
        const remoteItems = remoteCart.items || [];
        const remoteCartMapped = remoteItems.map((ri: any) => {
          const product = products.find(p => String(p.id) === String(ri.productId));
          if (!product) return null;

          return {
            ...product,
            quantity: ri.quantity,
            cartItemId: ri.cartItemId || `${product.id}-`,
            selectedAttributes: ri.selectedAttributes || {}
          };
        }).filter(Boolean);

        setCart(remoteCartMapped);
      } catch (error) {
        console.error('Background cart re-fetch failed:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, isAdmin, products.length]);

  const addToCart = useCallback((product: Product, selectedAttributes?: Record<string, string>) => {
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
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

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
