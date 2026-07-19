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
    withTimeout: vi.fn((p: any) => p),
  };
});

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getCart, syncCart, clearCart } from '../../controllers/cartController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, user: any = { id: 'user-1', email: 'test@test.com', role: 'user' }) {
  const req: any = { body, user };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('cartController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCart', () => {
    it('returns cart items for authenticated user', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { exists: true, data: () => ({ items: [{ productId: 'p1', quantity: 2 }] }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: [{ productId: 'p1', quantity: 2 }] });
    });

    it('returns empty items for new user', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await getCart(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: [] });
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: {}, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await getCart(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('syncCart', () => {
    it('syncs cart items successfully', async () => {
      const items = [{ productId: 'p1', quantity: 2 }, { productId: 'p2', quantity: 1 }];
      const { req, res } = mockReqRes({ items });

      const mockSet = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ set: mockSet }),
      });

      await syncCart(req, res);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ items }),
        { merge: true }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ items }));
    });

    it('returns 400 for non-array items', async () => {
      const { req, res } = mockReqRes({ items: 'not-array' });

      await syncCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: { items: [] }, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await syncCart(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('clearCart', () => {
    it('clears cart successfully', async () => {
      const { req, res } = mockReqRes();

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ delete: mockDelete }),
      });

      await clearCart(req, res);

      expect(mockDelete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Cart cleared' });
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: {}, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await clearCart(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
