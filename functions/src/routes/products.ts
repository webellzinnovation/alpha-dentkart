import { Router } from 'express';
import {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizeInput } from '../middleware/sanitize';

const router = Router();

// Public routes (optional auth for personalization)
router.get('/', optionalAuth, getAllProducts);
router.get('/:id', optionalAuth, getProductById);

// Admin routes (rate limited, sanitized)
router.post('/', authLimiter, sanitizeInput, authenticateToken, requireAdmin, createProduct);
router.put('/:id', authLimiter, sanitizeInput, authenticateToken, requireAdmin, updateProduct);
router.patch('/:id', authLimiter, sanitizeInput, authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authLimiter, sanitizeInput, authenticateToken, requireAdmin, deleteProduct);

export default router;
