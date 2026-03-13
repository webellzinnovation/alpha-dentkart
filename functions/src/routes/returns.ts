import { Router } from 'express';
import { 
    createReturnRequest,
    getUserReturnRequests,
    getReturnRequest,
    approveReturnRequest,
    processRefund,
    getReturnPolicy,
    getAllReturnRequests
} from '../controllers/returnController';
import { authenticateToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.get('/policy', getReturnPolicy);

// Protected routes
router.post('/', authenticateToken, authLimiter, createReturnRequest);
router.get('/me', authenticateToken, getUserReturnRequests);
router.get('/return/:id', authenticateToken, getReturnRequest);

// Admin routes
router.put('/:id/approve', authenticateToken, approveReturnRequest);
router.post('/:id/refund', authenticateToken, processRefund);
router.get('/admin/all', authenticateToken, getAllReturnRequests);
router.get('/all', authenticateToken, getUserReturnRequests);
router.get('/:id', authenticateToken, getReturnRequest);

export default router;