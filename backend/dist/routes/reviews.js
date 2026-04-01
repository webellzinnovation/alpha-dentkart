"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Public routes (optional auth for personalization)
router.get('/products/:productId', auth_1.optionalAuth, reviewController_1.getProductReviews);
router.get('/me', auth_1.authenticateToken, reviewController_1.getUserReviews);
router.get('/all', auth_1.authenticateToken, reviewController_1.getAllReviews);
// Protected routes
router.post('/', auth_1.authenticateToken, rateLimiter_1.authLimiter, reviewController_1.createReview);
router.put('/:id', auth_1.authenticateToken, reviewController_1.updateReview);
router.delete('/:id', auth_1.authenticateToken, reviewController_1.deleteReview);
router.post('/:id/helpful', reviewController_1.markReviewHelpful);
// Admin routes
router.put('/:id/moderate', auth_1.authenticateToken, reviewController_1.moderateReview);
exports.default = router;
//# sourceMappingURL=reviews.js.map