import { Router } from 'express';
import { register, login, logout, me, verifyEmail, resendVerification, getAllUsers, resetPassword } from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/reset-password', resetPassword);

// Email verification (public — token-based)
router.get('/verify-email', verifyEmail);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
router.post('/resend-verification', authenticateToken, resendVerification);

// Admin routes
router.get('/users', getAllUsers); // Temporarily open for dev - add auth back in production

export default router;
