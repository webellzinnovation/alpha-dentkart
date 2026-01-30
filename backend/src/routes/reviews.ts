import { Router } from 'express';
import { 
    getProductReviews, 
    getUserReviews, 
    createReview, 
    updateReview, 
    deleteReview, 
    markReviewHelpful,
    getAllReviews,
    moderateReview
} from '../controllers/reviewController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (optional auth for personalization)
router.get('/products/:productId', optionalAuth, getProductReviews);
router.get('/me', authenticateToken, getUserReviews);
router.get('/all', authenticateToken, getAllReviews);

// Protected routes
router.post('/', authenticateToken, authLimiter, createReview);
router.put('/:id', authenticateToken, updateReview);
router.delete('/:id', authenticateToken, deleteReview);
router.post('/:id/helpful', markReviewHelpful);

// Admin routes
router.put('/:id/moderate', authenticateToken, moderateReview);

export default router;