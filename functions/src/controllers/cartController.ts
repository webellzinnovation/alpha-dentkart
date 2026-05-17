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

export async function getCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const snapshot = await db.collection('carts').doc(userId).get();
    
    if (!snapshot.exists) {
      return res.json({ items: [] });
    }

    res.json(snapshot.data());
  } catch (error: any) {
    logger.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart: ' + error.message });
  }
}

export async function syncCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const { items } = req.body; // Expecting array of cart objects { productId, quantity }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const cartRef = db.collection('carts').doc(userId);
    await cartRef.set({ 
      items, 
      updatedAt: new Date().toISOString() 
    }, { merge: true });

    res.json({ message: 'Cart synced successfully', items });
  } catch (error: any) {
    logger.error('Error syncing cart:', error);
    res.status(500).json({ error: 'Failed to sync cart: ' + error.message });
  }
}

export async function clearCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await db.collection('carts').doc(userId).delete();
    res.json({ message: 'Cart cleared' });
  } catch (error: any) {
    logger.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}
