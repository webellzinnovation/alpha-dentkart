import { Router } from 'express';
import { getCart, syncCart, clearCart } from '../controllers/cartController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCart as any);
router.post('/sync', authenticateToken, syncCart as any);
router.delete('/', authenticateToken, clearCart as any);

export default router;
