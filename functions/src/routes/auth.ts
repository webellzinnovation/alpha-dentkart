import { Router, Request, Response } from 'express';
import { register, login, logout, me, verifyEmail, resendVerification, resetPassword, forgotPassword, updateProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { sanitizeInput } from '../middleware/sanitize';
import { db } from '../config/firebase';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

const router = Router();

// Admin login function
async function adminLogin(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        if (userData.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
        }
        const isValid = await bcrypt.compare(password, userData.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateToken({ id: userDoc.id, email: userData.email, role: 'admin' });
        res.cookie('__session', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 3600000 * 24 });
        res.json({ success: true, token, user: { id: userDoc.id, email: userData.email, role: 'admin', name: userData.name } });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Admin login endpoint (rate limited + sanitized)
router.post('/admin/login', authLimiter, sanitizeInput, adminLogin as any);

// Public routes with rate limiting (sanitized)
router.post('/register', authLimiter, sanitizeInput, register);
router.post('/login', authLimiter, sanitizeInput, login);
router.post('/forgot-password', authLimiter, sanitizeInput, forgotPassword);
router.post('/reset-password', authLimiter, sanitizeInput, resetPassword);

// Email verification (public — token-based)
router.get('/verify-email', verifyEmail);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/resend-verification', authenticateToken, authLimiter, resendVerification);

export default router;
