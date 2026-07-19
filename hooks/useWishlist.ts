import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, User } from '../types';
import { wishlistAPI } from '../utils/api';

export const useWishlist = (user: User | null, isAdmin: boolean, products: Product[]) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [hasLoadedRemote, setHasLoadedRemote] = useState(false);
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  const lastSyncedRef = useRef<string>('');
  const prevUserIdRef = useRef<string | null>(null);
  const userId = user?.id ?? null;

  // Persist to LocalStorage on every change
  useEffect(() => {
    localStorage.setItem('alpha_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync full wishlist to backend (only when list actually changed from user action)
  const syncToBackend = useCallback(async () => {
    if (!user || isAdmin || !hasLoadedRemote) return;
    const currentIds = wishlistRef.current.map(p => p.id).sort().join(',');
    if (currentIds === lastSyncedRef.current) return; // already synced
    lastSyncedRef.current = currentIds;
    try {
      await wishlistAPI.sync(wishlistRef.current.map(p => p.id));
    } catch (error) {
      console.error('Wishlist background sync failed:', error);
      lastSyncedRef.current = ''; // reset so next change retries
    }
  }, [user, isAdmin, hasLoadedRemote]);

  // Load from backend on login & tab focus
  useEffect(() => {
    if (isAdmin || products.length === 0) return;

    // Handle logout or user switch cleanup
    if (!userId) {
      if (prevUserIdRef.current !== null) {
        setWishlist([]);
        localStorage.removeItem('alpha_wishlist');
        setHasLoadedRemote(false);
        lastSyncedRef.current = '';
        prevUserIdRef.current = null;
      }
      return;
    }

    // If switching between different authenticated users, don't merge - just reset first
    if (prevUserIdRef.current && prevUserIdRef.current !== userId) {
      setWishlist([]);
      localStorage.removeItem('alpha_wishlist');
      setHasLoadedRemote(false);
      lastSyncedRef.current = '';
    }

    let cancelled = false;
    const loadRemoteWishlist = async () => {
      try {
        const remoteWishlist = await wishlistAPI.get().catch(() => ({ items: [] }));
        if (cancelled) return;
        const remoteItems = remoteWishlist.items || [];
        const remoteIds = new Set(remoteItems);
        const localWishlist = wishlistRef.current;

        const remoteProducts = products.filter(p => remoteIds.has(p.id));
        let merged = [...remoteProducts];

        // Transitioning from guest (null) to logged-in user: merge local guest items
        if (!prevUserIdRef.current && localWishlist.length > 0) {
          localWishlist.forEach((lp) => {
            if (!remoteIds.has(lp.id)) {
              merged.push(lp);
            }
          });

          // Sync merged wishlist to server immediately
          const mergedIds = merged.map(p => p.id);
          await wishlistAPI.sync(mergedIds).catch(err => console.error('Merged wishlist sync failed:', err));
          lastSyncedRef.current = mergedIds.sort().join(',');
        }

        if (!cancelled) {
          setWishlist(merged);
          setHasLoadedRemote(true);
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
      if (document.visibilityState !== 'visible' || products.length === 0) return;

      try {
        const remoteWishlist = await wishlistAPI.get().catch(() => ({ items: [] }));
        const remoteItems = remoteWishlist.items || [];
        const remoteIds = new Set(remoteItems);

        setWishlist(prevWishlist => {
          const remoteProducts = products.filter(p => remoteIds.has(p.id));
          const localOnly = prevWishlist.filter(p => !remoteIds.has(p.id));
          return [...remoteProducts, ...localOnly];
        });

        // Flush pending sync
        syncToBackend();
      } catch (error) {
        console.error('Background wishlist re-fetch failed:', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, isAdmin, products.length, syncToBackend]);

  // Toggle wishlist item
  const toggleWishlist = useCallback(async (product: Product) => {
    const exists = wishlistRef.current.some(item => item.id === product.id);

    // Update local state immediately (optimistic)
    setWishlist(prev => {
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });

    // Persist to backend immediately
    try {
      if (exists) {
        await wishlistAPI.remove(product.id);
      } else {
        await wishlistAPI.add(product.id);
      }
    } catch (error) {
      console.error('Wishlist API call failed:', error);
    }

    // Mark as needing re-sync so next visibility change picks it up
    lastSyncedRef.current = '';
  }, []);

  const isInWishlist = useCallback((id: string | number) => {
    return wishlist.some(item => item.id === id);
  }, [wishlist]);

  return {
    wishlist,
    setWishlist,
    toggleWishlist,
    isInWishlist
  };
};
