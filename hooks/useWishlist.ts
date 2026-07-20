import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Product, User } from '../types';
import { wishlistAPI } from '../utils/api';

export const useWishlist = (user: User | null, isAdmin: boolean, products: Product[]) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  const prevUserIdRef = useRef<string | null>(null);
  const productsRef = useRef(products);
  productsRef.current = products;
  const userId = user?.id ?? null;

  // Persist to LocalStorage on every change
  useEffect(() => {
    localStorage.setItem('alpha_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Load from backend on login
  useEffect(() => {
    if (isAdmin) return;

    // Handle logout or user switch cleanup
    if (!userId) {
      if (prevUserIdRef.current !== null) {
        setWishlist([]);
        localStorage.removeItem('alpha_wishlist');
        prevUserIdRef.current = null;
      }
      return;
    }

    // If switching between different authenticated users, reset first
    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      setWishlist([]);
      localStorage.removeItem('alpha_wishlist');
    }

    let cancelled = false;
    const loadRemoteWishlist = async () => {
      try {
        const remoteWishlist = await wishlistAPI.get().catch(() => ({ items: [] }));
        if (cancelled) return;
        const remoteItems = remoteWishlist.items || [];
        const remoteIds = new Set(remoteItems.map(String));
        const localWishlist = wishlistRef.current;

        // If products haven't loaded yet, store raw IDs as placeholders
        if (productsRef.current.length === 0) {
          if (!cancelled) {
            const placeholderProducts = remoteItems.map((id: string | number) => ({
              id: Number(id) || 0,
              name: 'Loading...',
              price: 0,
              originalPrice: 0,
              image: '',
              images: [],
              category: '',
              brand: '',
              stock: 0,
              rating: 0,
              reviews: 0,
              description: '',
              features: [],
              specifications: {},
            } as Product));
            setWishlist(placeholderProducts);
            prevUserIdRef.current = userId;
          }
          return;
        }

        const remoteProducts = productsRef.current.filter(p => remoteIds.has(String(p.id)));
        let merged = [...remoteProducts];

        // Transitioning from guest (null) to logged-in user: merge local guest items
        if (!prevUserIdRef.current && localWishlist.length > 0) {
          localWishlist.forEach((lp) => {
            if (!remoteIds.has(String(lp.id))) {
              merged.push(lp);
            }
          });

          // Sync merged wishlist to server immediately
          const mergedIds = merged.map(p => p.id);
          await wishlistAPI.sync(mergedIds).catch(err => console.error('Merged wishlist sync failed:', err));
        }

        // Enforce strict uniqueness by product ID
        const uniqueMerged = [];
        const seenIds = new Set();
        for (const item of merged) {
          const idStr = String(item.id);
          if (!seenIds.has(idStr)) {
            seenIds.add(idStr);
            uniqueMerged.push(item);
          }
        }

        if (!cancelled) {
          setWishlist(uniqueMerged);
          prevUserIdRef.current = userId;
        }
      } catch (error) {
        console.error('Failed to load remote wishlist:', error);
      }
    };
    loadRemoteWishlist();

    return () => { cancelled = true; };
  }, [userId, isAdmin, products.length]);

  // Re-fetch remote wishlist when tab regains focus (cross-device sync)
  useEffect(() => {
    if (!userId || isAdmin) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const remoteWishlist = await wishlistAPI.get().catch(() => ({ items: [] }));
        const remoteItems = remoteWishlist.items || [];
        const remoteIds = new Set(remoteItems.map(String));

        setWishlist(prevWishlist => {
          const remoteProducts = productsRef.current.filter(p => remoteIds.has(String(p.id)));
          const localOnly = prevWishlist.filter(p => !remoteIds.has(String(p.id)));
          const combined = [...remoteProducts, ...localOnly];

          // Enforce strict uniqueness by product ID
          const uniqueCombined = [];
          const seenIds = new Set();
          for (const item of combined) {
            const idStr = String(item.id);
            if (!seenIds.has(idStr)) {
              seenIds.add(idStr);
              uniqueCombined.push(item);
            }
          }
          return uniqueCombined;
        });
      } catch (error) {
        console.error('Background wishlist re-fetch failed:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, isAdmin, products.length]);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (product: Product) => {
    const exists = wishlistRef.current.some(item => String(item.id) === String(product.id));
    const previousWishlist = wishlistRef.current;

    // Update local state immediately (optimistic)
    setWishlist(prev => {
      if (exists) {
        return prev.filter(item => String(item.id) !== String(product.id));
      }
      return [...prev, product];
    });

    // Persist to backend immediately — rollback on failure
    try {
      if (exists) {
        await wishlistAPI.remove(product.id);
      } else {
        await wishlistAPI.add(product.id);
      }
    } catch (error) {
      console.error('Wishlist API call failed:', error);
      // Rollback to previous state
      setWishlist(previousWishlist);
      toast.error('Failed to update wishlist. Please try again.');
    }
  }, []);

  const isInWishlist = useCallback((id: string | number) => {
    return wishlist.some(item => String(item.id) === String(id));
  }, [wishlist]);

  return {
    wishlist,
    setWishlist,
    toggleWishlist,
    isInWishlist
  };
};
