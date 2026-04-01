"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminStatsController_1 = require("../controllers/adminStatsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, auth_1.requireAdmin, adminStatsController_1.getAdminStats);
exports.default = router;
//# sourceMappingURL=adminStats.js.map