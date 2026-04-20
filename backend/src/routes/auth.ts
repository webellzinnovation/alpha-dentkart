import { Router } from 'express';
import { register, login, logout, me, verifyEmail, resendVerification, updateProfile, resetPassword, forgotPassword, adminLogin } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizeInput } from '../middleware/sanitize';

const router = Router();

// Admin login endpoint (rate limited + sanitized)
router.post('/admin/login', authLimiter, sanitizeInput, adminLogin as any);

// Public routes with rate limiting (sanitized)
router.post('/register', authLimiter, sanitizeInput, register);
router.post('/login', authLimiter, sanitizeInput, login);
router.post('/forgot-password', authLimiter, sanitizeInput, forgotPassword);
router.post('/reset-password', sanitizeInput, resetPassword);

// Email verification (public — token-based)
router.get('/verify-email', verifyEmail);

// Protected routes (sanitized)
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
router.patch('/profile', authenticateToken, sanitizeInput, updateProfile);
router.post('/resend-verification', authenticateToken, resendVerification);

export default router;

