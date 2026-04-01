"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Public routes with rate limiting
router.post('/register', rateLimiter_1.authLimiter, authController_1.register);
router.post('/login', rateLimiter_1.authLimiter, authController_1.login);
// Email verification (public — token-based)
router.get('/verify-email', authController_1.verifyEmail);
// Protected routes
router.post('/logout', auth_1.authenticateToken, authController_1.logout);
router.get('/me', auth_1.authenticateToken, authController_1.me);
router.post('/resend-verification', auth_1.authenticateToken, authController_1.resendVerification);
exports.default = router;
//# sourceMappingURL=auth.js.map