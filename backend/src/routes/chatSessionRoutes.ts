import express from 'express';
import {
    createSession,
    getSession,
    getAllSessions,
    addMessage,
    updateSessionStatus
} from '../controllers/chatSessionController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes (for customers on the frontend)
router.post('/', createSession);
router.get('/:id', getSession);
router.post('/:id/messages', addMessage);

// Admin routes (for Admin Dashboard)
router.get('/', authenticateToken, requireAdmin, getAllSessions);
router.patch('/:id/status', authenticateToken, requireAdmin, updateSessionStatus);

export default router;
