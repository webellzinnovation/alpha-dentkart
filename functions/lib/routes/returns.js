"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const returnController_1 = require("../controllers/returnController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Public routes
router.get('/policy', returnController_1.getReturnPolicy);
// Protected routes
router.post('/', auth_1.authenticateToken, rateLimiter_1.authLimiter, returnController_1.createReturnRequest);
router.get('/me', auth_1.authenticateToken, returnController_1.getUserReturnRequests);
router.get('/return/:id', auth_1.authenticateToken, returnController_1.getReturnRequest);
// Admin routes
router.put('/:id/approve', auth_1.authenticateToken, returnController_1.approveReturnRequest);
router.post('/:id/refund', auth_1.authenticateToken, returnController_1.processRefund);
router.get('/admin/all', auth_1.authenticateToken, returnController_1.getAllReturnRequests);
router.get('/all', auth_1.authenticateToken, returnController_1.getUserReturnRequests);
router.get('/:id', auth_1.authenticateToken, returnController_1.getReturnRequest);
exports.default = router;
//# sourceMappingURL=returns.js.map