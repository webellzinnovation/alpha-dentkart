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
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/products/:productId', optionalAuth, getProductReviews);
router.get('/me', authenticateToken, getUserReviews);

// Admin routes — protected
router.get('/all', authenticateToken, requireAdmin, getAllReviews);
router.put('/:id/moderate', authenticateToken, requireAdmin, moderateReview);

// Protected user routes
router.post('/', authenticateToken, authLimiter, createReview);
router.put('/:id', authenticateToken, updateReview);
router.delete('/:id', authenticateToken, deleteReview);
router.post('/:id/helpful', optionalAuth, markReviewHelpful);

export default router;