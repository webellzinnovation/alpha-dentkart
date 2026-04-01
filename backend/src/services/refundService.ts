import { db, admin, withTimeout } from '../config/firebase';
import logger from '../utils/logger';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export async function initiateRefund(orderId: string, paymentId: string, amount: number): Promise<any> {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        logger.error('Razorpay credentials not configured for refund');
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
            const errorData = await response.json() as any;
            logger.error('Razorpay refund failed', { error: errorData, paymentId });
            throw new Error(errorData.error?.description || 'Refund failed');
        }

        const refundData = await response.json() as any;
        
        // Update order with refund info
        await db.collection('orders').doc(orderId).update({
            refundId: refundData.id,
            refundAmount: refundData.amount / 100,
            refundStatus: 'initiated',
            refundProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info('Refund initiated successfully', { orderId, refundId: refundData.id });
        return refundData;
    } catch (error) {
        logger.error('Refund error', { error, orderId, paymentId });
        throw error;
    }
}

export async function getRefundStatus(refundId: string): Promise<any> {
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
