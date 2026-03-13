"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpaySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Verifies the Razorpay payment signature
 * @param orderId - The razorpay_order_id
 * @param paymentId - The razorpay_payment_id
 * @param signature - The razorpay_signature
 * @returns boolean - true if signature is valid, false otherwise
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        console.error('RAZORPAY_KEY_SECRET is not defined in environment variables');
        return false;
    }
    const hmac = crypto_1.default.createHmac('sha256', keySecret);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};
exports.verifyRazorpaySignature = verifyRazorpaySignature;
//# sourceMappingURL=payment.js.map