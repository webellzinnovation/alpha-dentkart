"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Public routes
router.get('/products/:productId', auth_1.optionalAuth, reviewController_1.getProductReviews);
router.get('/me', auth_1.authenticateToken, reviewController_1.getUserReviews);
// Admin routes — protected
router.get('/all', auth_1.authenticateToken, auth_1.requireAdmin, reviewController_1.getAllReviews);
router.put('/:id/moderate', auth_1.authenticateToken, auth_1.requireAdmin, reviewController_1.moderateReview);
// Protected user routes
router.post('/', auth_1.authenticateToken, rateLimiter_1.authLimiter, reviewController_1.createReview);
router.put('/:id', auth_1.authenticateToken, reviewController_1.updateReview);
router.delete('/:id', auth_1.authenticateToken, reviewController_1.deleteReview);
router.post('/:id/helpful', auth_1.optionalAuth, reviewController_1.markReviewHelpful);
exports.default = router;
//# sourceMappingURL=reviews.js.map