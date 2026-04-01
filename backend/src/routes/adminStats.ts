import { Router } from 'express';
import { getAdminStats } from '../controllers/adminStatsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, requireAdmin, getAdminStats);

export default router;
