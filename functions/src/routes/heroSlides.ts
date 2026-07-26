import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { heroSlideSchema } from '../utils/validation';
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
router.post('/', authenticateToken, requireAdmin, validateBody(heroSlideSchema), createHeroSlide);
router.patch('/:id', authenticateToken, requireAdmin, validateBody(heroSlideSchema), updateHeroSlide);
router.delete('/:id', authenticateToken, requireAdmin, deleteHeroSlide);
router.patch('/reorder/batch', authenticateToken, requireAdmin, reorderHeroSlides);

export default router;
