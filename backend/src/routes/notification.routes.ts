import { Router } from 'express';
import { db } from '../config/firebase'; // Firestore

const router = Router();

// Save or update FCM token for a user
router.post('/save-token', async (req, res) => {
    const { userId, token } = req.body;

    if (!userId || !token) {
        return res.status(400).json({ error: 'User ID and Token are required' });
    }

    try {
        await db.collection('users').doc(userId).set({
            fcmToken: token,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({ success: true, message: 'Token saved successfully' });
    } catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
