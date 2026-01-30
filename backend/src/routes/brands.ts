import { Router } from 'express';
import { getAllBrands, toggleBrandFeatured, reorderFeaturedBrands } from '../controllers/brandController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getAllBrands);
router.patch('/:id/featured', authenticateToken, requireAdmin, toggleBrandFeatured);
router.patch('/featured/reorder', authenticateToken, requireAdmin, reorderFeaturedBrands);

export default router;

