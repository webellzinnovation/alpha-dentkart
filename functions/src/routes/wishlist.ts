import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, syncWishlist } from '../controllers/wishlistController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getWishlist as any);
router.post('/', authenticateToken, addToWishlist as any);
router.delete('/:productId', authenticateToken, removeFromWishlist as any);
router.post('/sync', authenticateToken, syncWishlist as any);

export default router;
