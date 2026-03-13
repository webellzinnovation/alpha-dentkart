import crypto from 'crypto';

/**
 * Verifies the Razorpay payment signature
 * @param orderId - The razorpay_order_id
 * @param paymentId - The razorpay_payment_id
 * @param signature - The razorpay_signature
 * @returns boolean - true if signature is valid, false otherwise
 */
export const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        console.error('RAZORPAY_KEY_SECRET is not defined in environment variables');
        return false;
    }

    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(orderId + '|' + paymentId);
    const generatedSignature = hmac.digest('hex');

    return generatedSignature === signature;
};
