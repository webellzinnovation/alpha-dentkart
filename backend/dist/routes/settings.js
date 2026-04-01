"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public: frontend fetches store name, logo etc.
router.get('/', settingsController_1.getSettings);
router.get('/admin', auth_1.authenticateToken, auth_1.requireAdmin, settingsController_1.getAdminSettings);
// Admin only: update all settings
router.put('/', auth_1.authenticateToken, auth_1.requireAdmin, settingsController_1.updateSettings);
exports.default = router;
//# sourceMappingURL=settings.js.map