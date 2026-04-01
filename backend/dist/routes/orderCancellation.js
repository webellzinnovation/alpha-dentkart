"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderCancellationController_1 = require("../controllers/orderCancellationController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protected routes (authentication required)
router.post('/cancel/:orderId', auth_1.authenticateToken, rateLimiter_1.authLimiter, orderCancellationController_1.cancelOrder);
router.post('/bulk-cancel', auth_1.authenticateToken, rateLimiter_1.authLimiter, orderCancellationController_1.bulkCancelOrders);
router.get('/reasons', auth_1.authenticateToken, rateLimiter_1.authLimiter, orderCancellationController_1.getCancellationReasons);
router.get('/history', auth_1.authenticateToken, rateLimiter_1.authLimiter, orderCancellationController_1.getOrderCancellationHistory);
router.get('/check/:orderId', auth_1.authenticateToken, rateLimiter_1.authLimiter, orderCancellationController_1.getOrderForCancellation);
exports.default = router;
//# sourceMappingURL=orderCancellation.js.map