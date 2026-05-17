import { useState, useEffect } from 'react';
import { Product, User } from '../types';
import { wishlistAPI } from '../utils/api';

export const useWishlist = (user: User | null, isAdmin: boolean, products: Product[]) => {
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('alpha_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to LocalStorage
  useEffect(() => {
    localStorage.setItem('alpha_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync to backend when wishlist changes
  useEffect(() => {
    if (user && !isAdmin && products.length > 0) {
      const syncTimeout = setTimeout(async () => {
        try {
          await wishlistAPI.sync(wishlist.map(p => p.id));
        } catch (error) {
          console.error('Wishlist background sync failed:', error);
        }
      }, 3000);
      return () => clearTimeout(syncTimeout);
    }
  }, [wishlist, user, isAdmin, products.length]);

  // Load from backend on login
  useEffect(() => {
    if (user && !isAdmin && products.length > 0) {
      const loadRemoteWishlist = async () => {
        try {
          const remoteWishlist = await wishlistAPI.get().catch(() => ({ items: [] }));
          if (remoteWishlist.items?.length > 0) {
            const wishlistItems = products.filter(p => remoteWishlist.items.includes(p.id));
            if (wishlistItems.length > 0) setWishlist(wishlistItems);
          }
        } catch (error) {
          console.error('Failed to load remote wishlist:', error);
        }
      };
      loadRemoteWishlist();
    }
  }, [user?.uid, isAdmin, products.length > 0]);

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (id: string | number) => {
    return wishlist.some(item => item.id === id);
  };

  return {
    wishlist,
    setWishlist,
    toggleWishlist,
    isInWishlist
  };
};
