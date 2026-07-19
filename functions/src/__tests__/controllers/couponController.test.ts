import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../config/firebase', () => {
  const firestoreMock: any = {
    collection: vi.fn(),
    doc: vi.fn(),
    get: vi.fn(),
    add: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
  };
  firestoreMock.collection.mockReturnValue(firestoreMock);
  firestoreMock.doc.mockReturnValue(firestoreMock);
  firestoreMock.where.mockReturnValue(firestoreMock);
  firestoreMock.orderBy.mockReturnValue(firestoreMock);
  firestoreMock.limit.mockReturnValue(firestoreMock);

  return {
    db: firestoreMock,
    admin: {
      firestore: {
        FieldValue: {
          increment: vi.fn(),
        },
      },
    },
  };
});

vi.mock('../../utils/validation', () => ({
  createCouponSchema: {
    parse: vi.fn((d: any) => d),
    safeParse: vi.fn((d: any) => ({ success: true, data: d })),
    partial: vi.fn().mockReturnThis(),
  },
  validateCouponSchema: {
    parse: vi.fn((d: any) => d),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createCoupon, getAllCoupons, getCouponByCode, validateCoupon, deleteCoupon, getCouponAnalytics } from '../../controllers/couponController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, params: any = {}, user: any = { id: 'admin-1', role: 'admin' }) {
  const req: any = { body, params, user };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('couponController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCoupon', () => {
    it('creates a coupon as admin', async () => {
      const { req, res } = mockReqRes({
        code: 'WELCOME15',
        type: 'percentage',
        value: 15,
        isActive: true,
        startsAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const mockSnapshot = { empty: true, docs: [] };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
        add: vi.fn().mockResolvedValue({ id: 'coupon-id' }),
      });

      await createCoupon(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ code: 'WELCOME15' }),
        })
      );
    });

    it('returns 403 for non-admin user', async () => {
      const { req, res } = mockReqRes({ code: 'TEST' }, {}, { id: 'user-1', role: 'user' });

      await createCoupon(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 for duplicate code', async () => {
      const { req, res } = mockReqRes({ code: 'EXISTING' });

      const mockSnapshot = { empty: false, docs: [{ id: 'existing', data: () => ({ code: 'EXISTING' }) }] };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await createCoupon(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllCoupons', () => {
    it('returns all coupons for admin', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { id: 'coupon-1', data: () => ({ code: 'SAVE20', type: 'percentage', value: 20 }) };
      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [mockDoc] }) }),
      });

      await getAllCoupons(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([expect.objectContaining({ code: 'SAVE20' })]),
        })
      );
    });

    it('returns 403 for non-admin', async () => {
      const { req, res } = mockReqRes({}, {}, { id: 'user-1', role: 'user' });

      await getAllCoupons(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getCouponByCode', () => {
    it('returns coupon by code', async () => {
      const { req, res } = mockReqRes({}, { code: 'WELCOME15' });

      const mockDoc = { id: 'coupon-1', data: () => ({ code: 'WELCOME15', type: 'percentage', value: 15 }) };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: false, docs: [mockDoc] }) }) }),
      });

      await getCouponByCode(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ code: 'WELCOME15' }) })
      );
    });

    it('returns 404 for non-existent code', async () => {
      const { req, res } = mockReqRes({}, { code: 'NONEXISTENT' });

      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: true, docs: [] }) }) }),
      });

      await getCouponByCode(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('validateCoupon', () => {
    it('validates an active coupon', async () => {
      const { req, res } = mockReqRes({ code: 'WELCOME15', cartTotal: 1000 });

      const mockDoc = {
        id: 'coupon-1',
        data: () => ({
          code: 'WELCOME15',
          type: 'percentage',
          value: 15,
          isActive: true,
          startsAt: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          minimumAmount: 500,
        }),
      };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: false, docs: [mockDoc] }) }) }),
      });

      await validateCoupon(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          discountAmount: expect.any(Number),
        })
      );
    });

    it('returns 400 for expired coupon', async () => {
      const { req, res } = mockReqRes({ code: 'EXPIRED', cartTotal: 1000 });

      const mockDoc = {
        id: 'coupon-1',
        data: () => ({
          code: 'EXPIRED',
          type: 'percentage',
          value: 10,
          isActive: true,
          startsAt: new Date(Date.now() - 172800000).toISOString(),
          expiresAt: new Date(Date.now() - 86400000).toISOString(),
        }),
      };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ empty: false, docs: [mockDoc] }) }) }),
      });

      await validateCoupon(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteCoupon', () => {
    it('deletes a coupon as admin', async () => {
      const { req, res } = mockReqRes({}, { id: 'coupon-1' });

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ delete: mockDelete }),
      });

      await deleteCoupon(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Coupon deleted successfully' });
      expect(mockDelete).toHaveBeenCalled();
    });

    it('returns 403 for non-admin', async () => {
      const { req, res } = mockReqRes({}, { id: 'coupon-1' }, { id: 'user-1', role: 'user' });

      await deleteCoupon(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getCouponAnalytics', () => {
    it('returns analytics for admin', async () => {
      const { req, res } = mockReqRes();

      const mockDoc1 = { data: () => ({ isActive: true, usageCount: 10 }) };
      const mockDoc2 = { data: () => ({ isActive: false, usageCount: 5 }) };
      (db.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [mockDoc1, mockDoc2] }),
      });

      await getCouponAnalytics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          analytics: expect.objectContaining({
            totalCoupons: 2,
            activeCoupons: 1,
            totalUsage: 15,
          }),
        })
      );
    });
  });
});
