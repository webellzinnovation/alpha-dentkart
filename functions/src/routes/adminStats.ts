import { Router } from 'express';
import { getAdminStats } from '../controllers/adminStatsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Admin only route - protected
router.get('/', authenticateToken, requireAdmin, getAdminStats);

export default router;
