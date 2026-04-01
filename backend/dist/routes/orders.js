"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All order routes require authentication
router.post('/', auth_1.authenticateToken, orderController_1.createOrder);
router.get('/me', auth_1.authenticateToken, orderController_1.getMyOrders);
exports.default = router;
//# sourceMappingURL=orders.js.map