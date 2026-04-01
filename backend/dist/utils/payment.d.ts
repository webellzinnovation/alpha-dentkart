/**
 * Verifies the Razorpay payment signature
 * @param orderId - The razorpay_order_id
 * @param paymentId - The razorpay_payment_id
 * @param signature - The razorpay_signature
 * @returns boolean - true if signature is valid, false otherwise
 */
export declare const verifyRazorpaySignature: (orderId: string, paymentId: string, signature: string) => boolean;
//# sourceMappingURL=payment.d.ts.map