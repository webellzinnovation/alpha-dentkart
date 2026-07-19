import { describe, it, expect, vi } from 'vitest';
import {
  formatAmountForRazorpay,
  formatAmountFromRazorpay,
  verifyPaymentSignature,
  createRazorpayOrder,
  getPaymentSettings,
  savePaymentSettings,
} from '../../../utils/razorpayService';

describe('razorpayService', () => {
  describe('formatAmountForRazorpay', () => {
    it('converts rupees to paise', () => {
      expect(formatAmountForRazorpay(100)).toBe(10000);
    });

    it('handles decimal amounts', () => {
      expect(formatAmountForRazorpay(99.99)).toBe(9999);
    });

    it('rounds to nearest paise', () => {
      expect(formatAmountForRazorpay(10.555)).toBe(1056);
    });

    it('handles zero', () => {
      expect(formatAmountForRazorpay(0)).toBe(0);
    });
  });

  describe('formatAmountFromRazorpay', () => {
    it('converts paise to rupees', () => {
      expect(formatAmountFromRazorpay(10000)).toBe(100);
    });

    it('handles zero', () => {
      expect(formatAmountFromRazorpay(0)).toBe(0);
    });
  });

  describe('verifyPaymentSignature', () => {
    it('returns true when all values are present', () => {
      expect(verifyPaymentSignature('order1', 'pay1', 'sig1', 'secret')).toBe(true);
    });

    it('returns false when orderId is empty', () => {
      expect(verifyPaymentSignature('', 'pay1', 'sig1', 'secret')).toBe(false);
    });

    it('returns false when paymentId is empty', () => {
      expect(verifyPaymentSignature('order1', '', 'sig1', 'secret')).toBe(false);
    });

    it('returns false when signature is empty', () => {
      expect(verifyPaymentSignature('order1', 'pay1', '', 'secret')).toBe(false);
    });
  });

  describe('createRazorpayOrder', () => {
    it('generates order ID with order_ prefix', () => {
      const orderId = createRazorpayOrder(1000);
      expect(orderId).toMatch(/^order_/);
    });

    it('generates unique order IDs', () => {
      const id1 = createRazorpayOrder(1000);
      const id2 = createRazorpayOrder(1000);
      expect(id1).not.toBe(id2);
    });
  });

  describe('payment settings', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns defaults when no settings saved', () => {
      const settings = getPaymentSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.testMode).toBe(true);
    });

    it('saves and loads payment settings', () => {
      const newSettings = { enabled: false, testMode: false, keyId: 'key_123' };
      savePaymentSettings(newSettings);
      const loaded = getPaymentSettings();
      expect(loaded.keyId).toBe('key_123');
      expect(loaded.enabled).toBe(false);
    });
  });
});
