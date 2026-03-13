"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// User routes
router.post('/', auth_1.authenticateToken, orderController_1.createOrder);
router.get('/me', auth_1.authenticateToken, orderController_1.getMyOrders);
// Razorpay: create server-side order before payment
router.post('/razorpay-order', auth_1.authenticateToken, orderController_1.createRazorpayOrder);
// Admin routes — all protected
router.get('/all', auth_1.authenticateToken, auth_1.requireAdmin, orderController_1.getAllOrders);
router.patch('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, orderController_1.updateOrderStatus);
router.delete('/:id', auth_1.authenticateToken, auth_1.requireAdmin, orderController_1.deleteOrder);
exports.default = router;
//# sourceMappingURL=orders.js.map