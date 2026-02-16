import { Router } from 'express';
import { register, login, logout, me, verifyEmail, resendVerification } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Email verification (public — token-based)
router.get('/verify-email', verifyEmail);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
router.post('/resend-verification', authenticateToken, resendVerification);

export default router;

