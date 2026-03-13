"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const deliveryEstimationController_1 = require("../controllers/deliveryEstimationController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.post('/check-pincode', deliveryEstimationController_1.checkPincodeServiceability);
// Authenticated routes
router.post('/calculate', auth_1.authenticateToken, deliveryEstimationController_1.calculateDeliveryEstimation);
router.post('/cart-estimate', auth_1.authenticateToken, deliveryEstimationController_1.getCartDeliveryEstimate);
router.post('/shipping-cost', auth_1.authenticateToken, deliveryEstimationController_1.getShippingCost);
router.get('/history', auth_1.authenticateToken, deliveryEstimationController_1.getDeliveryHistory);
router.get('/analytics', auth_1.authenticateToken, deliveryEstimationController_1.getDeliveryAnalytics);
exports.default = router;
//# sourceMappingURL=deliveryEstimation.js.map