"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiateRefund = initiateRefund;
exports.getRefundStatus = getRefundStatus;
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
async function initiateRefund(orderId, paymentId, amount) {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        logger_1.default.error('Razorpay credentials not configured for refund');
        throw new Error('Payment gateway not configured');
    }
    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const refundPayload = {
        amount: Math.round(amount * 100), // Convert to paise
        speed: 'normal',
        notes: {
            orderId,
            reason: 'Customer cancelled order'
        }
    };
    try {
        const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: JSON.stringify(refundPayload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            logger_1.default.error('Razorpay refund failed', { error: errorData, paymentId });
            throw new Error(errorData.error?.description || 'Refund failed');
        }
        const refundData = await response.json();
        // Update order with refund info
        await firebase_1.db.collection('orders').doc(orderId).update({
            refundId: refundData.id,
            refundAmount: refundData.amount / 100,
            refundStatus: 'initiated',
            refundProcessedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
        });
        logger_1.default.info('Refund initiated successfully', { orderId, refundId: refundData.id });
        return refundData;
    }
    catch (error) {
        logger_1.default.error('Refund error', { error, orderId, paymentId });
        throw error;
    }
}
async function getRefundStatus(refundId) {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        throw new Error('Payment gateway not configured');
    }
    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/refunds/${refundId}`, {
        headers: {
            'Authorization': `Basic ${basicAuth}`,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to get refund status');
    }
    return response.json();
}
//# sourceMappingURL=refundService.js.map