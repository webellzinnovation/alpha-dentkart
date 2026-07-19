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
  };
});

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getWishlist, addToWishlist, removeFromWishlist, syncWishlist } from '../../controllers/wishlistController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, params: any = {}, user: any = { id: 'user-1', email: 'test@test.com', role: 'user' }) {
  const req: any = { body, params, user };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('wishlistController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWishlist', () => {
    it('returns wishlist items for authenticated user', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { exists: true, data: () => ({ items: ['prod-1', 'prod-2'] }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await getWishlist(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: ['prod-1', 'prod-2'] });
    });

    it('returns empty items for new user', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await getWishlist(req, res);

      expect(res.json).toHaveBeenCalledWith({ items: [] });
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: {}, params: {}, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await getWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('addToWishlist', () => {
    it('adds product to wishlist', async () => {
      const { req, res } = mockReqRes({ productId: 'prod-1' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          set: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await addToWishlist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items: expect.arrayContaining(['prod-1']) })
      );
    });

    it('does not add duplicate product', async () => {
      const { req, res } = mockReqRes({ productId: 'prod-1' });

      const mockDoc = { exists: true, data: () => ({ items: ['prod-1'] }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          set: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await addToWishlist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items: ['prod-1'] })
      );
    });

    it('returns 400 without productId', async () => {
      const { req, res } = mockReqRes({});

      await addToWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: { productId: 'prod-1' }, params: {}, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await addToWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('removeFromWishlist', () => {
    it('removes product from wishlist', async () => {
      const { req, res } = mockReqRes({}, { productId: 'prod-1' });

      const mockDoc = { exists: true, data: () => ({ items: ['prod-1', 'prod-2'] }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await removeFromWishlist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items: ['prod-2'] })
      );
    });

    it('returns 404 when wishlist not found', async () => {
      const { req, res } = mockReqRes({}, { productId: 'prod-1' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await removeFromWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: {}, params: { productId: 'prod-1' }, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await removeFromWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('syncWishlist', () => {
    it('syncs wishlist items successfully', async () => {
      const items = ['prod-1', 'prod-2', 'prod-3'];
      const { req, res } = mockReqRes({ items });

      const mockSet = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ set: mockSet }),
      });

      await syncWishlist(req, res);

      expect(mockSet).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items })
      );
    });

    it('deduplicates items', async () => {
      const items = ['prod-1', 'prod-1', 'prod-2'];
      const { req, res } = mockReqRes({ items });

      const mockSet = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ set: mockSet }),
      });

      await syncWishlist(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ items: ['prod-1', 'prod-2'] })
      );
    });

    it('returns 400 for non-array items', async () => {
      const { req, res } = mockReqRes({ items: 'not-array' });

      await syncWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when not authenticated', async () => {
      const req: any = { body: { items: [] }, params: {}, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await syncWishlist(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
