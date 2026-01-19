import { Router } from 'express';
import { getAllProducts, getProductById } from '../controllers/productController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes (optional auth for personalization)
router.get('/', optionalAuth, getAllProducts);
router.get('/:id', optionalAuth, getProductById);

export default router;
