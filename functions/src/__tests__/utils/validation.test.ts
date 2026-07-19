import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userUpdateSchema,
  createCouponSchema,
  validateCouponSchema,
  createOrderSchema,
} from '../../utils/validation';

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const data = {
      email: 'test@example.com',
      password: 'StrongPass1!',
      name: 'Test User',
    };
    const result = registerSchema.parse(data);
    expect(result.email).toBe('test@example.com');
    expect(result.userType).toBe('regular');
  });

  it('rejects invalid email', () => {
    expect(() => registerSchema.parse({
      email: 'invalid',
      password: 'StrongPass1!',
      name: 'Test',
    })).toThrow();
  });

  it('rejects weak password (no uppercase)', () => {
    expect(() => registerSchema.parse({
      email: 'test@example.com',
      password: 'weakpass1!',
      name: 'Test',
    })).toThrow();
  });

  it('rejects weak password (no lowercase)', () => {
    expect(() => registerSchema.parse({
      email: 'test@example.com',
      password: 'WEAKPASS1!',
      name: 'Test',
    })).toThrow();
  });

  it('rejects weak password (no number)', () => {
    expect(() => registerSchema.parse({
      email: 'test@example.com',
      password: 'WeakPass!',
      name: 'Test',
    })).toThrow();
  });

  it('rejects weak password (no special char)', () => {
    expect(() => registerSchema.parse({
      email: 'test@example.com',
      password: 'WeakPass1',
      name: 'Test',
    })).toThrow();
  });

  it('rejects short password', () => {
    expect(() => registerSchema.parse({
      email: 'test@example.com',
      password: 'Ab1!',
      name: 'Test',
    })).toThrow();
  });

  it('rejects short name', () => {
    expect(() => registerSchema.parse({
      email: 'test@example.com',
      password: 'StrongPass1!',
      name: 'A',
    })).toThrow();
  });

  it('accepts dental-doctor userType with info', () => {
    const data = {
      email: 'doctor@clinic.com',
      password: 'StrongPass1!',
      name: 'Dr. Smith',
      userType: 'dental-doctor' as const,
      dentalDoctorInfo: {
        licenseId: 'DRC-12345',
        licenseState: 'Maharashtra',
      },
    };
    const result = registerSchema.parse(data);
    expect(result.userType).toBe('dental-doctor');
    expect(result.dentalDoctorInfo?.licenseId).toBe('DRC-12345');
  });
});

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.parse({ email: 'test@example.com', password: 'pass' });
    expect(result.email).toBe('test@example.com');
  });

  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'test@example.com', password: '' })).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'pass' })).toThrow();
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.parse({ email: 'test@example.com' });
    expect(result.email).toBe('test@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => forgotPasswordSchema.parse({ email: 'bad' })).toThrow();
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.parse({
      token: 'reset-token-123',
      newPassword: 'NewStrong1!',
    });
    expect(result.token).toBe('reset-token-123');
  });

  it('rejects empty token', () => {
    expect(() => resetPasswordSchema.parse({
      token: '',
      newPassword: 'NewStrong1!',
    })).toThrow();
  });

  it('rejects weak new password', () => {
    expect(() => resetPasswordSchema.parse({
      token: 'token',
      newPassword: 'weak',
    })).toThrow();
  });
});

describe('createCouponSchema', () => {
  it('accepts valid percentage coupon', () => {
    const result = createCouponSchema.parse({
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      startsAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.code).toBe('SAVE10');
    expect(result.type).toBe('percentage');
  });

  it('rejects short coupon code', () => {
    expect(() => createCouponSchema.parse({
      code: 'AB',
      type: 'percentage',
      value: 10,
      startsAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })).toThrow();
  });

  it('rejects negative value', () => {
    expect(() => createCouponSchema.parse({
      code: 'SAVE10',
      type: 'percentage',
      value: -5,
      startsAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    })).toThrow();
  });
});

describe('validateCouponSchema', () => {
  it('accepts valid validation request', () => {
    const result = validateCouponSchema.parse({
      code: 'SAVE10',
      cartTotal: 1000,
    });
    expect(result.code).toBe('SAVE10');
  });

  it('rejects empty code', () => {
    expect(() => validateCouponSchema.parse({ code: '', cartTotal: 1000 })).toThrow();
  });
});

describe('createOrderSchema', () => {
  it('accepts valid order', () => {
    const result = createOrderSchema.parse({
      items: [{ productId: 1, name: 'Test', quantity: 2, price: 500 }],
      total: 1000,
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1000);
  });

  it('accepts empty items (validation may be deferred)', () => {
    expect(() => createOrderSchema.parse({
      items: [],
      total: 0,
    })).not.toThrow();
  });

  it('rejects zero quantity', () => {
    expect(() => createOrderSchema.parse({
      items: [{ productId: 1, name: 'Test', quantity: 0, price: 500 }],
      total: 0,
    })).toThrow();
  });
});
