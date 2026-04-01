import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { registerPushToken, getUserPushTokens } from '../controllers/pushNotificationController';

const router = Router();

// Register push notification token for authenticated user
router.post('/register', authenticateToken, registerPushToken);

// Get all push tokens for authenticated user (for testing/admin)
router.get('/user', authenticateToken, getUserPushTokens);

export default router;