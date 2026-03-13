"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase"); // Firestore
const router = (0, express_1.Router)();
// Save or update FCM token for a user
router.post('/save-token', async (req, res) => {
    const { userId, token } = req.body;
    if (!userId || !token) {
        return res.status(400).json({ error: 'User ID and Token are required' });
    }
    try {
        await firebase_1.db.collection('users').doc(userId).set({
            fcmToken: token,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        res.json({ success: true, message: 'Token saved successfully' });
    }
    catch (error) {
        console.error('Error saving FCM token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=notification.routes.js.map