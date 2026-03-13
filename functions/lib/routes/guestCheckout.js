"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const guestCheckoutController_1 = require("../controllers/guestCheckoutController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Public routes (no authentication required)
router.post('/session/create', rateLimiter_1.authLimiter, guestCheckoutController_1.createGuestSession);
router.get('/session/validate/:sessionId', rateLimiter_1.authLimiter, guestCheckoutController_1.validateGuestSession);
router.post('/order/create', rateLimiter_1.authLimiter, guestCheckoutController_1.createGuestOrder);
router.get('/order/:orderId', rateLimiter_1.authLimiter, guestCheckoutController_1.getGuestOrder);
router.put('/order/:orderId', rateLimiter_1.authLimiter, guestCheckoutController_1.updateGuestOrder);
router.get('/order/:orderId/status', rateLimiter_1.authLimiter, guestCheckoutController_1.getGuestOrderStatus);
router.get('/session/:sessionId/orders', rateLimiter_1.authLimiter, guestCheckoutController_1.getGuestOrders);
// Protected routes (authentication required)
// These would be used when guest wants to create account after checkout
router.post('/order/:orderId/convert', guestCheckoutController_1.convertGuestOrder);
exports.default = router;
//# sourceMappingURL=guestCheckout.js.map