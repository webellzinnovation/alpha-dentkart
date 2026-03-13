"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shiprocketController_1 = require("../controllers/shiprocketController");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Validation helper function
const validateRequest = (req, res, requiredFields) => {
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                message: `${field} is required`
            });
        }
    }
    return null;
};
// Public routes
router.post('/check-pincode', rateLimiter_1.authLimiter, (req, res) => {
    const validation = validateRequest(req, res, ['pincode']);
    if (validation)
        return;
    (0, shiprocketController_1.checkPincodeServiceability)(req, res);
});
router.post('/get-rates', rateLimiter_1.authLimiter, (req, res) => {
    const validation = validateRequest(req, res, ['deliveryPincode']);
    if (validation)
        return;
    (0, shiprocketController_1.getShippingRates)(req, res);
});
router.post('/estimate-delivery', rateLimiter_1.authLimiter, (req, res) => {
    const validation = validateRequest(req, res, ['deliveryPincode']);
    if (validation)
        return;
    (0, shiprocketController_1.getEstimatedDelivery)(req, res);
});
router.post('/calculate-charges', rateLimiter_1.authLimiter, (req, res) => {
    const validation = validateRequest(req, res, ['deliveryPincode']);
    if (validation)
        return;
    (0, shiprocketController_1.calculateShippingCharges)(req, res);
});
// Protected routes
router.post('/create-order', auth_1.authenticateToken, (req, res) => {
    const validation = validateRequest(req, res, ['orderData']);
    if (validation)
        return;
    (0, shiprocketController_1.createShiprocketOrder)(req, res);
});
router.post('/track', auth_1.authenticateToken, (req, res) => {
    const { awbNumber, orderId } = req.body;
    if (!awbNumber && !orderId) {
        return res.status(400).json({
            success: false,
            message: 'Either AWB number or Order ID is required'
        });
    }
    (0, shiprocketController_1.trackShipment)(req, res);
});
router.post('/track-order', auth_1.authenticateToken, (req, res) => {
    const validation = validateRequest(req, res, ['orderId']);
    if (validation)
        return;
    (0, shiprocketController_1.trackShipment)(req, res); // Reuse same function with orderId
});
router.post('/cancel', auth_1.authenticateToken, (req, res) => {
    const validation = validateRequest(req, res, ['orderIds']);
    if (validation)
        return;
    (0, shiprocketController_1.cancelShiprocketOrder)(req, res);
});
router.post('/available-couriers', rateLimiter_1.authLimiter, (req, res) => {
    const validation = validateRequest(req, res, ['deliveryPincode']);
    if (validation)
        return;
    (0, shiprocketController_1.getAvailableCouriers)(req, res);
});
exports.default = router;
//# sourceMappingURL=shiprocket.js.map