import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: frontend fetches store name, logo etc.
router.get('/', getSettings);

// Admin only: update all settings
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router;
