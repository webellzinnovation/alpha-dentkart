"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const pushNotificationController_1 = require("../controllers/pushNotificationController");
const router = (0, express_1.Router)();
// Register push notification token for authenticated user
router.post('/register', auth_1.authenticateToken, pushNotificationController_1.registerPushToken);
// Get all push tokens for authenticated user (for testing/admin)
router.get('/user', auth_1.authenticateToken, pushNotificationController_1.getUserPushTokens);
exports.default = router;
//# sourceMappingURL=pushNotifications.js.map