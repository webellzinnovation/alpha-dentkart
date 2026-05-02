import { describe, it, expect } from 'vitest';

describe('Basic Smoke Tests', () => {
  it('passes basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('validates product price', () => {
    const price = 3000;
    const discount = 10;
    const finalPrice = price - (price * discount / 100);
    expect(finalPrice).toBe(2700);
  });

  it('checks email format', () => {
    const isValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(isValid('test@example.com')).toBe(true);
    expect(isValid('invalid')).toBe(false);
  });

  it('validates Indian phone', () => {
    const isValid = (phone: string) => /^[6-9]\d{9}$/.test(phone.replace(/^\+91/, ''));
    expect(isValid('9876543210')).toBe(true);
    expect(isValid('123')).toBe(false);
  });
});
