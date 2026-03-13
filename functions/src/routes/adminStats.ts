import { Router } from 'express';
import { getAdminStats } from '../controllers/adminStatsController';

const router = Router();

// Admin only route - open for dev
router.get('/', getAdminStats);

export default router;
