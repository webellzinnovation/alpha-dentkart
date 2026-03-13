"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminStatsController_1 = require("../controllers/adminStatsController");
const router = (0, express_1.Router)();
// Admin only route - open for dev
router.get('/', adminStatsController_1.getAdminStats);
exports.default = router;
//# sourceMappingURL=adminStats.js.map