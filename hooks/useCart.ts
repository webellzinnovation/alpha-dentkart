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

  const userId = user?.id ?? null;

  // Reset on user change — clear stale data from previous user
  useEffect(() => {
    if (userId) {
      localStorage.removeItem('alpha_cart');
      setCart([]);
      setHasLoadedRemote(false);
    }
  }, [userId]);

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

  // Load from backend on login
  useEffect(() => {
    if (!user || isAdmin || products.length === 0) return;

    let cancelled = false;
    const loadRemoteCart = async () => {
      try {
        const remoteCart = await cartAPI.get().catch(() => ({ items: [] }));
        if (cancelled) return;

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

          if (!cancelled) {
            setCart(prevCart => {
              const merged = [...prevCart];
              cartItems.forEach((ri: any) => {
                if (!ri) return;
                const idx = merged.findIndex(item => item.cartItemId === ri.cartItemId);
                if (idx > -1) {
                  merged[idx].quantity = Math.max(merged[idx].quantity, ri.quantity);
                } else {
                  merged.push(ri);
                }
              });
              return merged;
            });
          }
        }
      } catch (error) {
        console.error('Failed to load remote cart:', error);
      } finally {
        if (!cancelled) setHasLoadedRemote(true);
      }
    };
    loadRemoteCart();

    return () => { cancelled = true; };
  }, [userId, isAdmin, products.length > 0]);

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
