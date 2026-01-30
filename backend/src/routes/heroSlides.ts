import { Router } from 'express';
import {
    getAllHeroSlides,
    createHeroSlide,
    updateHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides
} from '../controllers/heroSlideController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllHeroSlides);

// Admin routes
router.post('/', authenticateToken, requireAdmin, createHeroSlide);
router.patch('/:id', authenticateToken, requireAdmin, updateHeroSlide);
router.delete('/:id', authenticateToken, requireAdmin, deleteHeroSlide);
router.patch('/reorder/batch', authenticateToken, requireAdmin, reorderHeroSlides);

export default router;
