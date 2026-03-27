import { Router } from 'express';
import { db } from '../config/firebase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Save or update FCM token for authenticated user
router.post('/save-token', authenticateToken, async (req: AuthRequest, res) => {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        await db.collection('users').doc(userId).set({
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({ success: true, message: 'Token saved successfully' });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
