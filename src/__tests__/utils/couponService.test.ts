import { describe, it, expect, vi } from 'vitest';
import couponService from '../../../utils/couponService';

describe('CouponService', () => {
  const service = couponService;

  describe('calculateDiscount', () => {
    it('calculates percentage discount', () => {
      const coupon = { type: 'percentage', value: 10, maximumDiscount: undefined } as any;
      expect(service.calculateDiscount(coupon, 1000)).toBe(100);
    });

    it('calculates fixed discount', () => {
      const coupon = { type: 'fixed', value: 200, maximumDiscount: undefined } as any;
      expect(service.calculateDiscount(coupon, 1000)).toBe(200);
    });

    it('calculates free shipping discount', () => {
      const coupon = { type: 'free_shipping', value: 0 } as any;
      expect(service.calculateDiscount(coupon, 1000)).toBe(150);
    });

    it('caps discount at maximumDiscount', () => {
      const coupon = { type: 'percentage', value: 50, maximumDiscount: 300 } as any;
      expect(service.calculateDiscount(coupon, 1000)).toBe(300);
    });

    it('does not cap when below maximumDiscount', () => {
      const coupon = { type: 'percentage', value: 10, maximumDiscount: 500 } as any;
      expect(service.calculateDiscount(coupon, 1000)).toBe(100);
    });
  });

  describe('formatCouponDescription', () => {
    it('formats percentage coupon', () => {
      const coupon = { type: 'percentage', value: 10 } as any;
      expect(service.formatCouponDescription(coupon)).toBe('10% discount on all orders');
    });

    it('formats fixed coupon', () => {
      const coupon = { type: 'fixed', value: 200 } as any;
      expect(service.formatCouponDescription(coupon)).toBe('\u20B9200 off your order');
    });

    it('formats free shipping coupon', () => {
      const coupon = { type: 'free_shipping', value: 0 } as any;
      expect(service.formatCouponDescription(coupon)).toBe('Free shipping on all orders');
    });
  });

  describe('isCouponValidForUser', () => {
    it('returns false for inactive coupon', () => {
      const coupon = { isActive: false, expiresAt: futureDate(), startsAt: pastDate(), userType: 'all' } as any;
      expect(service.isCouponValidForUser(coupon)).toBe(false);
    });

    it('returns false for expired coupon', () => {
      const coupon = { isActive: true, expiresAt: pastDate(), startsAt: pastDate(), userType: 'all' } as any;
      expect(service.isCouponValidForUser(coupon)).toBe(false);
    });

    it('returns false for not-yet-started coupon', () => {
      const coupon = { isActive: true, expiresAt: futureDate(), startsAt: futureDate(), userType: 'all' } as any;
      expect(service.isCouponValidForUser(coupon)).toBe(false);
    });

    it('returns true for valid active coupon', () => {
      const coupon = { isActive: true, expiresAt: futureDate(), startsAt: pastDate(), userType: 'all' } as any;
      expect(service.isCouponValidForUser(coupon)).toBe(true);
    });

    it('checks user type restriction', () => {
      const coupon = { isActive: true, expiresAt: futureDate(), startsAt: pastDate(), userType: 'dental-doctor' } as any;
      expect(service.isCouponValidForUser(coupon, 'dental-doctor')).toBe(true);
      expect(service.isCouponValidForUser(coupon, 'regular')).toBe(false);
    });
  });

  describe('canApplyToCart', () => {
    it('returns valid for applicable coupon', () => {
      const coupon = { isActive: true, expiresAt: futureDate(), minimumAmount: 500 } as any;
      expect(service.canApplyToCart(coupon, 1000).isValid).toBe(true);
    });

    it('fails when below minimum amount', () => {
      const coupon = { isActive: true, expiresAt: futureDate(), minimumAmount: 5000 } as any;
      const result = service.canApplyToCart(coupon, 1000);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('5000');
    });

    it('fails when usage limit reached', () => {
      const coupon = { isActive: true, expiresAt: futureDate(), usageLimit: 10, usageCount: 10 } as any;
      const result = service.canApplyToCart(coupon, 1000);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('usage limit');
    });

    it('fails when expired', () => {
      const coupon = { isActive: true, expiresAt: pastDate() } as any;
      expect(service.canApplyToCart(coupon, 1000).isValid).toBe(false);
    });

    it('fails when inactive', () => {
      const coupon = { isActive: false, expiresAt: futureDate() } as any;
      expect(service.canApplyToCart(coupon, 1000).isValid).toBe(false);
    });
  });

  describe('formatDiscountAmount', () => {
    it('formats percentage discount', () => {
      const coupon = { type: 'percentage', value: 10 } as any;
      expect(service.formatDiscountAmount(coupon, 100)).toBe('10% (\u20B9100.00)');
    });

    it('formats fixed discount', () => {
      const coupon = { type: 'fixed', value: 200 } as any;
      expect(service.formatDiscountAmount(coupon, 200)).toBe('\u20B9200.00');
    });

    it('formats free shipping', () => {
      const coupon = { type: 'free_shipping', value: 0 } as any;
      expect(service.formatDiscountAmount(coupon, 150)).toBe('FREE SHIPPING');
    });
  });

  describe('getCouponSuggestions', () => {
    it('returns an array', () => {
      const suggestions = service.getCouponSuggestions(5000);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });
});

function futureDate(): string {
  return new Date(Date.now() + 86400000).toISOString();
}

function pastDate(): string {
  return new Date(Date.now() - 86400000).toISOString();
}
