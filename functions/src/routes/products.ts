import { Router } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (optional auth for personalization)
router.get('/', optionalAuth, getAllProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin routes
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.patch('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;
