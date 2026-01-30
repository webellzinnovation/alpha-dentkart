import { Router } from 'express';
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
router.post('/', authenticateToken, requireAdmin, createPromotionalTile);
router.patch('/:id', authenticateToken, requireAdmin, updatePromotionalTile);
router.delete('/:id', authenticateToken, requireAdmin, deletePromotionalTile);
router.patch('/reorder/batch', authenticateToken, requireAdmin, reorderPromotionalTiles);

export default router;
