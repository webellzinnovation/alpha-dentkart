"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shippingController_1 = require("../controllers/shippingController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Protected routes
router.post('/create', auth_1.authenticateToken, rateLimiter_1.authLimiter, shippingController_1.createShipment);
router.get('/track/:trackingId', auth_1.authenticateToken, shippingController_1.trackShipment);
router.post('/rates', auth_1.authenticateToken, shippingController_1.getShippingRates);
router.get('/pincode/:pincode', shippingController_1.checkPincodeServiceability);
// User order tracking
router.get('/order/:orderId', auth_1.authenticateToken, shippingController_1.getUserOrderTracking);
// Admin routes
router.get('/admin/all', auth_1.authenticateToken, shippingController_1.getAllShipments);
exports.default = router;
//# sourceMappingURL=shipping.js.map