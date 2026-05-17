import { Request, Response } from 'express';
import { db } from '../config/firebase';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function getWishlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const snapshot = await db.collection('wishlists').doc(userId).get();
    
    if (!snapshot.exists) {
      return res.json({ items: [] });
    }

    res.json(snapshot.data());
  } catch (error: any) {
    logger.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist: ' + error.message });
  }
}

export async function addToWishlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const wishlistRef = db.collection('wishlists').doc(userId);
    const doc = await wishlistRef.get();

    let items = [];
    if (doc.exists) {
      items = doc.data()?.items || [];
    }

    // Check if product already in wishlist
    if (!items.includes(productId)) {
      items.push(productId);
      await wishlistRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true });
    }

    res.json({ message: 'Added to wishlist', items });
  } catch (error: any) {
    logger.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist: ' + error.message });
  }
}

export async function removeFromWishlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const wishlistRef = db.collection('wishlists').doc(userId);
    const doc = await wishlistRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    let items = doc.data()?.items || [];
    items = items.filter((id: string) => id !== productId);

    await wishlistRef.update({ items, updatedAt: new Date().toISOString() });

    res.json({ message: 'Removed from wishlist', items });
  } catch (error: any) {
    logger.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist: ' + error.message });
  }
}

export async function syncWishlist(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { items } = req.body; // Expecting array of product IDs

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array of product IDs' });
    }

    const wishlistRef = db.collection('wishlists').doc(userId);
    await wishlistRef.set({ 
      items, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });

    res.json({ message: 'Wishlist synced successfully', items });
  } catch (error: any) {
    logger.error('Error syncing wishlist:', error);
    res.status(500).json({ error: 'Failed to sync wishlist: ' + error.message });
  }
}
