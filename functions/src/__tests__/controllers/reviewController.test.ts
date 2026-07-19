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
          increment: vi.fn((v: number) => v),
        },
      },
    },
  };
});

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getProductReviews, createReview, getAllReviews } from '../../controllers/reviewController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, params: any = {}, query: any = {}, user: any = { id: 'user-1', role: 'user', userType: 'regular', email: 'test@test.com' }) {
  const req: any = { body, params, query, user };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('reviewController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductReviews', () => {
    it('returns reviews for a product', async () => {
      const { req, res } = mockReqRes({}, { productId: 'prod-1' });

      const mockDoc = {
        id: 'review-1',
        data: () => ({
          productId: 'prod-1',
          rating: 5,
          title: 'Great product',
          content: 'Excellent quality',
          userId: 'user-1',
        }),
      };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [mockDoc], size: 1 }),
        }),
      });

      await getProductReviews(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: expect.arrayContaining([expect.objectContaining({ id: 'review-1' })]),
          pagination: expect.objectContaining({ total: 1 }),
        })
      );
    });
  });

  describe('createReview', () => {
    it('creates a review as authenticated user', async () => {
      const { req, res } = mockReqRes({
        productId: 'prod-1',
        rating: 5,
        title: 'Great product',
        content: 'Excellent dental product quality',
      });

      const mockAdd = vi.fn().mockResolvedValue({ id: 'new-review-id' });
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      const mockGet = vi.fn();

      // orders collection
      mockGet.mockResolvedValueOnce({
        docs: [{ data: () => ({ items: [{ productId: 'prod-1' }] }) }],
      });
      // reviews collection (duplicate check)
      mockGet.mockResolvedValueOnce({ empty: true, docs: [] });
      // reviews collection (for updateProductRatings)
      mockGet.mockResolvedValueOnce({ docs: [{ data: () => ({ rating: 5, userType: 'regular', isApproved: true }) }] });

      (db.collection as any).mockImplementation((col: string) => {
        if (col === 'orders') {
          return {
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({
                docs: [{ data: () => ({ items: [{ productId: 'prod-1' }] }) }],
              }),
            }),
          };
        }
        if (col === 'users') {
          return {
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ name: 'Test User', userType: 'regular' }) }),
            }),
          };
        }
        if (col === 'products') {
          return {
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ name: 'Test Product', images: ['img.jpg'] }) }),
              update: mockUpdate,
            }),
          };
        }
        // reviews collection - needs chained .where().where().limit().get()
        if (col === 'reviews') {
          const rChain: any = {};
          rChain.where = vi.fn().mockReturnValue(rChain);
          rChain.limit = vi.fn().mockReturnValue(rChain);
          rChain.orderBy = vi.fn().mockReturnValue(rChain);
          rChain.get = vi.fn()
            .mockResolvedValueOnce({ empty: true, docs: [] }) // duplicate check
            .mockResolvedValueOnce({ docs: [{ data: () => ({ rating: 5, userType: 'regular', isApproved: true }) }] }); // updateProductRatings
          rChain.add = mockAdd;
          rChain.doc = vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ productId: 'prod-1', rating: 5, userType: 'regular' }) }),
            update: mockUpdate,
          });
          rChain.update = mockUpdate;
          return rChain;
        }
        return { where: vi.fn().mockReturnThis(), get: vi.fn().mockResolvedValue({ docs: [] }) };
      });

      await createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          review: expect.objectContaining({ id: 'new-review-id', rating: 5 }),
        })
      );
    });

    it('returns 401 for unauthenticated user', async () => {
      const req: any = { body: { productId: 'p1', rating: 5, title: 'T', content: 'Test content here' }, params: {}, query: {}, user: undefined };
      const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };

      await createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 for duplicate review', async () => {
      const { req, res } = mockReqRes({
        productId: 'prod-1',
        rating: 5,
        title: 'Great',
        content: 'Already reviewed this product before',
      });

      const mockExistingReview = { id: 'existing', data: () => ({}) };

      (db.collection as any).mockImplementation((col: string) => {
        if (col === 'orders') {
          return {
            where: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue({ docs: [] }),
            }),
          };
        }
        if (col === 'reviews') {
          const chain: any = {};
          chain.where = vi.fn().mockReturnValue(chain);
          chain.limit = vi.fn().mockReturnValue(chain);
          chain.get = vi.fn().mockResolvedValue({ empty: false, docs: [mockExistingReview] });
          chain.add = vi.fn();
          return chain;
        }
        return {
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
          }),
        };
      });

      await createReview(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllReviews', () => {
    it('returns all reviews for admin', async () => {
      const { req, res } = mockReqRes({}, {}, {}, { id: 'admin-1', role: 'admin' });

      const mockDoc = {
        id: 'review-1',
        data: () => ({
          productId: 'prod-1',
          rating: 4,
          title: 'Good',
          content: 'Decent product quality',
          userId: 'user-1',
        }),
      };
      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
          }),
        }),
      });

      await getAllReviews(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: expect.arrayContaining([expect.objectContaining({ id: 'review-1' })]),
        })
      );
    });

    it('returns 403 for non-admin', async () => {
      const { req, res } = mockReqRes({}, {}, {}, { id: 'user-1', role: 'user' });

      await getAllReviews(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
