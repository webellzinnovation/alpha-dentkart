import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { promotionalTileSchema } from '../utils/validation';
import {
    getAllPromotionalTiles,
    createPromotionalTile,
    updatePromotionalTile,
    deletePromotionalTile,
    reorderPromotionalTiles
} from '../controllers/promotionalTileController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllPromotionalTiles);

// Admin routes
router.post('/', authenticateToken, requireAdmin, validateBody(promotionalTileSchema), createPromotionalTile);
router.patch('/:id', authenticateToken, requireAdmin, validateBody(promotionalTileSchema), updatePromotionalTile);
router.delete('/:id', authenticateToken, requireAdmin, deletePromotionalTile);
router.patch('/reorder/batch', authenticateToken, requireAdmin, reorderPromotionalTiles);

export default router;
