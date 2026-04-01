import { Router, Request, Response } from 'express';
import { db, admin, withTimeout } from '../config/firebase';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

interface CartItem {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    selectedAttributes?: Record<string, string>;
}

interface CartData {
    items: CartItem[];
    updatedAt: any;
}

// Save cart for logged-in user
router.post('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { items } = req.body as { items: CartItem[] };

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid cart items' });
        }

        const cartRef = db.collection('carts').doc(userId);
        await cartRef.set({
            items,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('Cart saved', { userId, itemCount: items.length });
        res.json({ success: true, message: 'Cart saved' });
    } catch (error) {
        logger.error('Save cart error', { error });
        res.status(500).json({ error: 'Failed to save cart' });
    }
});

// Get cart for logged-in user
router.get('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const cartDoc = await withTimeout(db.collection('carts').doc(userId).get());

        if (!cartDoc.exists) {
            return res.json({ items: [] });
        }

        const cartData = cartDoc.data() as CartData;
        res.json({ items: cartData.items || [] });
    } catch (error) {
        logger.error('Get cart error', { error });
        res.status(500).json({ error: 'Failed to get cart' });
    }
});

// Merge local cart with server cart
router.post('/merge', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { localItems } = req.body as { localItems: CartItem[] };

        if (!localItems || !Array.isArray(localItems)) {
            return res.status(400).json({ error: 'Invalid local items' });
        }

        const cartRef = db.collection('carts').doc(userId);
        const cartDoc = await withTimeout(cartRef.get());

        let serverItems: CartItem[] = [];
        if (cartDoc.exists) {
            const cartData = cartDoc.data() as CartData;
            serverItems = cartData.items || [];
        }

        // Merge logic: local items take precedence, add new server items
        const mergedItems = [...serverItems];
        for (const localItem of localItems) {
            const existingIndex = mergedItems.findIndex(
                item => item.productId === localItem.productId && 
                        JSON.stringify(item.selectedAttributes) === JSON.stringify(localItem.selectedAttributes)
            );
            if (existingIndex >= 0) {
                // Update quantity
                mergedItems[existingIndex].quantity += localItem.quantity;
            } else {
                // Add new item
                mergedItems.push(localItem);
            }
        }

        // Save merged cart
        await cartRef.set({
            items: mergedItems,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('Cart merged', { userId, itemCount: mergedItems.length });
        res.json({ items: mergedItems });
    } catch (error) {
        logger.error('Merge cart error', { error });
        res.status(500).json({ error: 'Failed to merge cart' });
    }
});

// Clear cart
router.delete('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        await withTimeout(db.collection('carts').doc(userId).delete());

        logger.info('Cart cleared', { userId });
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        logger.error('Clear cart error', { error });
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

export default router;
