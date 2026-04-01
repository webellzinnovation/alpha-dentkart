import { Router } from 'express';
import { getAdminSettings, getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: frontend fetches store name, logo etc.
router.get('/', getSettings);
router.get('/admin', authenticateToken, requireAdmin, getAdminSettings);

// Admin only: update all settings
router.put('/', authenticateToken, requireAdmin, updateSettings);

export default router;
