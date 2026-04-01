"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../middleware/rateLimiter");
const couponController = __importStar(require("../controllers/couponController"));
const router = (0, express_1.Router)();
// Admin routes (authentication required)
router.post('/', rateLimiter_1.authLimiter, (req, res) => couponController.createCoupon(req, res));
router.get('/', rateLimiter_1.authLimiter, (req, res) => couponController.getAllCoupons(req, res));
router.get('/analytics', rateLimiter_1.authLimiter, (req, res) => couponController.getCouponAnalytics(req, res));
router.get('/:id', rateLimiter_1.authLimiter, (req, res) => couponController.getCouponByCode(req, res));
router.put('/:id', rateLimiter_1.authLimiter, (req, res) => couponController.updateCoupon(req, res));
router.delete('/:id', rateLimiter_1.authLimiter, (req, res) => couponController.deleteCoupon(req, res));
// Public routes (no authentication required)
router.post('/validate', rateLimiter_1.authLimiter, (req, res) => couponController.validateCoupon(req, res));
router.post('/apply', rateLimiter_1.authLimiter, (req, res) => couponController.applyCoupon(req, res));
exports.default = router;
//# sourceMappingURL=coupon.js.map