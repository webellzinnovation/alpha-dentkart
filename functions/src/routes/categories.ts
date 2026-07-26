import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../utils/validation';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllCategories);

// Admin routes
router.post('/', authenticateToken, requireAdmin, validateBody(createCategorySchema), createCategory);
router.put('/:id', authenticateToken, requireAdmin, validateBody(updateCategorySchema), updateCategory);
router.patch('/:id', authenticateToken, requireAdmin, validateBody(updateCategorySchema), updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;
