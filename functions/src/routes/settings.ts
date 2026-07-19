import { Router } from 'express';
import { getSettings, updateSettings, sendTestEmail } from '../controllers/settingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Public: frontend fetches store name, logo etc.
router.get('/', getSettings);

// Admin only: update all settings
router.put('/', authenticateToken, requireAdmin, updateSettings);

// Admin only: send test emails
router.post('/test-email', authenticateToken, requireAdmin, sendTestEmail);

export default router;
