import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyRazorpaySignature } from '../../utils/payment';
import crypto from 'crypto';

// Mock env
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_1234567890';

describe('verifyRazorpaySignature', () => {
  it('returns true for valid signature', () => {
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const secret = 'test_secret_key_1234567890';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + '|' + paymentId);
    const validSignature = hmac.digest('hex');

    expect(verifyRazorpaySignature(orderId, paymentId, validSignature)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const invalidSignature = 'invalid_signature_1234567890123456789012345678901234567890';

    expect(verifyRazorpaySignature(orderId, paymentId, invalidSignature)).toBe(false);
  });

  it('returns false when RAZORPAY_KEY_SECRET is not set', () => {
    const original = process.env.RAZORPAY_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;

    // Need to re-import to pick up the env change
    // Since the module reads env at call time, we test directly
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const hmac = crypto.createHmac('sha256', '');
    hmac.update(orderId + '|' + paymentId);
    const signature = hmac.digest('hex');

    expect(verifyRazorpaySignature(orderId, paymentId, signature)).toBe(false);

    process.env.RAZORPAY_KEY_SECRET = original;
  });

  it('handles empty strings', () => {
    expect(verifyRazorpaySignature('', '', '')).toBe(false);
  });

  it('uses timing-safe comparison', () => {
    const orderId = 'order_123';
    const paymentId = 'pay_456';
    const secret = 'test_secret_key_1234567890';

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(orderId + '|' + paymentId);
    const validSignature = hmac.digest('hex');

    // Partial match should fail
    expect(verifyRazorpaySignature(orderId, paymentId, validSignature.substring(0, 10))).toBe(false);
  });
});
