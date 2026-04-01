"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
function verifyRazorpayWebhookSignature(body, signature) {
    if (!RAZORPAY_WEBHOOK_SECRET) {
        logger_1.default.warn('Razorpay webhook secret not configured');
        return false;
    }
    const expectedSignature = crypto_1.default
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
router.post('/razorpay', async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const body = JSON.stringify(req.body);
        // Verify webhook signature (optional but recommended)
        if (signature && RAZORPAY_WEBHOOK_SECRET) {
            const isValid = verifyRazorpayWebhookSignature(body, signature);
            if (!isValid) {
                logger_1.default.warn('Invalid Razorpay webhook signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }
        }
        const event = req.body.event;
        const payload = req.body.payload;
        logger_1.default.info('Razorpay webhook received', { event });
        switch (event) {
            case 'payment.captured': {
                const payment = payload?.payment?.entity;
                const paymentId = payment?.id;
                const orderId = payment?.order_id;
                if (paymentId) {
                    // Find and update the order
                    const ordersSnapshot = await firebase_1.db.collection('orders')
                        .where('razorpay_order_id', '==', orderId)
                        .limit(1)
                        .get();
                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'paid',
                            status: 'Processing',
                            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger_1.default.info('Order payment confirmed via webhook', { orderId, paymentId });
                    }
                }
                break;
            }
            case 'payment.failed': {
                const payment = payload?.payment?.entity;
                const paymentId = payment?.id;
                const orderId = payment?.order_id;
                if (orderId) {
                    const ordersSnapshot = await firebase_1.db.collection('orders')
                        .where('razorpay_order_id', '==', orderId)
                        .limit(1)
                        .get();
                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'failed',
                            status: 'Payment Failed',
                            paymentError: payment?.error?.description || 'Payment failed',
                            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger_1.default.warn('Order payment failed via webhook', { orderId, paymentId });
                    }
                }
                break;
            }
            case 'order.paid': {
                const order = payload?.order?.entity;
                const razorpayOrderId = order?.id;
                if (razorpayOrderId) {
                    const ordersSnapshot = await firebase_1.db.collection('orders')
                        .where('razorpay_order_id', '==', razorpayOrderId)
                        .limit(1)
                        .get();
                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'paid',
                            status: 'Processing',
                            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger_1.default.info('Order paid via webhook', { razorpayOrderId });
                    }
                }
                break;
            }
            case 'refund.processed': {
                const refund = payload?.refund?.entity;
                const refundId = refund?.id;
                const paymentId = refund?.payment_id;
                if (paymentId) {
                    const ordersSnapshot = await firebase_1.db.collection('orders')
                        .where('paymentId', '==', paymentId)
                        .limit(1)
                        .get();
                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'refunded',
                            refundId: refundId,
                            refundAmount: refund?.amount,
                            refundStatus: 'completed',
                            updatedAt: firebase_1.admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger_1.default.info('Order refunded via webhook', { paymentId, refundId });
                    }
                }
                break;
            }
            default:
                logger_1.default.info('Unhandled Razorpay webhook event', { event });
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        logger_1.default.error('Razorpay webhook error', { error });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map