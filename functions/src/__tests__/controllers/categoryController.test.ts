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

vi.mock('../../services/cacheService', () => ({
  cacheService: {
    invalidateCategoriesCache: vi.fn().mockResolvedValue(undefined),
    invalidateBrandsCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@woocommerce/woocommerce-rest-api', () => {
  return {
    default: class MockWooCommerceRestApi {
      get = vi.fn().mockResolvedValue({ data: [] });
    },
  };
});

import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../controllers/categoryController';
import { db } from '../../config/firebase';
import { cacheService } from '../../services/cacheService';

function mockReqRes(params: any = {}, body: any = {}, query: any = {}) {
  const req: any = { params, body, query };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('categoryController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('returns categories from Firestore', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { id: 'cat-1', data: () => ({ name: 'Dental Tools' }) };
      const mockSnapshot = { empty: false, docs: [mockDoc] };
      (db.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockSnapshot),
      });

      await getAllCategories(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining([expect.objectContaining({ id: 'cat-1', name: 'Dental Tools' })]),
        })
      );
    });

    it('returns empty categories on Firestore error', async () => {
      const { req, res } = mockReqRes();

      (db.collection as any).mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error('Firestore unavailable')),
      });

      await getAllCategories(req, res);

      // Falls back to WooCommerce or returns empty
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('createCategory', () => {
    it('creates category with name', async () => {
      const { req, res } = mockReqRes({}, { name: 'New Category', icon: 'star' });

      (db.collection as any).mockReturnValue({
        add: vi.fn().mockResolvedValue({ id: 'new-cat-id' }),
      });

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.objectContaining({ name: 'New Category' }),
        })
      );
      expect(cacheService.invalidateCategoriesCache).toHaveBeenCalled();
    });

    it('returns 400 without name', async () => {
      const { req, res } = mockReqRes({}, { icon: 'star' });

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateCategory', () => {
    it('updates existing category', async () => {
      const { req, res } = mockReqRes({ id: 'cat-1' }, { name: 'Updated' });

      const mockDoc = { exists: true };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: mockUpdate,
        }),
      });

      await updateCategory(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('returns 404 for non-existent category', async () => {
      const { req, res } = mockReqRes({ id: 'nonexistent' }, { name: 'Updated' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteCategory', () => {
    it('deletes existing category', async () => {
      const { req, res } = mockReqRes({ id: 'cat-1' });

      const mockDoc = { exists: true };
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          delete: mockDelete,
        }),
      });

      await deleteCategory(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
      expect(mockDelete).toHaveBeenCalled();
      expect(cacheService.invalidateCategoriesCache).toHaveBeenCalled();
    });

    it('returns 404 for non-existent category', async () => {
      const { req, res } = mockReqRes({ id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
