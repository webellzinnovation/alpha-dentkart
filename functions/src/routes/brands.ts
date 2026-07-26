import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { createBrandSchema, updateBrandSchema } from '../utils/validation';
import {
    getAllBrands,
    toggleBrandFeatured,
    reorderFeaturedBrands,
    createBrand,
    updateBrand,
    deleteBrand
} from '../controllers/brandController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getAllBrands);

// Admin routes
router.post('/', authenticateToken, requireAdmin, validateBody(createBrandSchema), createBrand);
router.put('/:id', authenticateToken, requireAdmin, validateBody(updateBrandSchema), updateBrand);
router.patch('/:id/featured', authenticateToken, requireAdmin, toggleBrandFeatured);
router.patch('/featured/reorder', authenticateToken, requireAdmin, reorderFeaturedBrands);
router.delete('/:id', authenticateToken, requireAdmin, deleteBrand);

export default router;

