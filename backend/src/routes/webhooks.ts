import { Router, Request, Response } from 'express';
import { db, admin, withTimeout } from '../config/firebase';
import logger from '../utils/logger';
import crypto from 'crypto';

const router = Router();

const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

function verifyRazorpayWebhookSignature(body: string, signature: string): boolean {
    if (!RAZORPAY_WEBHOOK_SECRET) {
        logger.warn('Razorpay webhook secret not configured');
        return false;
    }
    
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

router.post('/razorpay', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const body = JSON.stringify(req.body);

        // Verify webhook signature (optional but recommended)
        if (signature && RAZORPAY_WEBHOOK_SECRET) {
            const isValid = verifyRazorpayWebhookSignature(body, signature);
            if (!isValid) {
                logger.warn('Invalid Razorpay webhook signature');
                return res.status(400).json({ error: 'Invalid signature' });
            }
        }

        const event = req.body.event;
        const payload = req.body.payload;

        logger.info('Razorpay webhook received', { event });

        switch (event) {
            case 'payment.captured': {
                const payment = payload?.payment?.entity;
                const paymentId = payment?.id;
                const orderId = payment?.order_id;

                if (paymentId) {
                    // Find and update the order
                    const ordersSnapshot = await db.collection('orders')
                        .where('razorpay_order_id', '==', orderId)
                        .limit(1)
                        .get();

                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'paid',
                            status: 'Processing',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger.info('Order payment confirmed via webhook', { orderId, paymentId });
                    }
                }
                break;
            }

            case 'payment.failed': {
                const payment = payload?.payment?.entity;
                const paymentId = payment?.id;
                const orderId = payment?.order_id;

                if (orderId) {
                    const ordersSnapshot = await db.collection('orders')
                        .where('razorpay_order_id', '==', orderId)
                        .limit(1)
                        .get();

                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'failed',
                            status: 'Payment Failed',
                            paymentError: payment?.error?.description || 'Payment failed',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger.warn('Order payment failed via webhook', { orderId, paymentId });
                    }
                }
                break;
            }

            case 'order.paid': {
                const order = payload?.order?.entity;
                const razorpayOrderId = order?.id;

                if (razorpayOrderId) {
                    const ordersSnapshot = await db.collection('orders')
                        .where('razorpay_order_id', '==', razorpayOrderId)
                        .limit(1)
                        .get();

                    if (!ordersSnapshot.empty) {
                        const orderDoc = ordersSnapshot.docs[0];
                        await orderDoc.ref.update({
                            paymentStatus: 'paid',
                            status: 'Processing',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger.info('Order paid via webhook', { razorpayOrderId });
                    }
                }
                break;
            }

            case 'refund.processed': {
                const refund = payload?.refund?.entity;
                const refundId = refund?.id;
                const paymentId = refund?.payment_id;

                if (paymentId) {
                    const ordersSnapshot = await db.collection('orders')
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
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        logger.info('Order refunded via webhook', { paymentId, refundId });
                    }
                }
                break;
            }

            default:
                logger.info('Unhandled Razorpay webhook event', { event });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Razorpay webhook error', { error });
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
