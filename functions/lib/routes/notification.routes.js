"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Save or update FCM token for authenticated user
router.post('/save-token', auth_1.authenticateToken, async (req, res) => {
    const { token } = req.body;
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }
    try {
        await firebase_1.db.collection('users').doc(userId).set({
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString()
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