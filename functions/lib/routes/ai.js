"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// AI chat endpoint - requires authentication and rate limiting
router.post('/chat', auth_1.authenticateToken, rateLimiter_1.aiLimiter, aiController_1.chatWithAI);
exports.default = router;
//# sourceMappingURL=ai.js.map