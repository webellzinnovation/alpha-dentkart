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
    offset: vi.fn(),
    count: vi.fn(),
  };
  firestoreMock.collection.mockReturnValue(firestoreMock);
  firestoreMock.doc.mockReturnValue(firestoreMock);
  firestoreMock.where.mockReturnValue(firestoreMock);
  firestoreMock.orderBy.mockReturnValue(firestoreMock);
  firestoreMock.limit.mockReturnValue(firestoreMock);
  firestoreMock.offset.mockReturnValue(firestoreMock);
  firestoreMock.count.mockReturnValue(firestoreMock);

  return {
    db: firestoreMock,
    withTimeout: vi.fn((p: any) => p),
    admin: { firestore: { FieldValue: { increment: vi.fn(), serverTimestamp: vi.fn() } } },
  };
});

vi.mock('../../services/cacheService', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    invalidateProductsCache: vi.fn().mockResolvedValue(undefined),
    invalidateCategoriesCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/generateKeywords', () => ({
  generateKeywords: vi.fn().mockReturnValue(['test', 'product']),
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../../controllers/productController';
import { db } from '../../config/firebase';
import { cacheService } from '../../services/cacheService';

function mockReqRes(query: any = {}, params: any = {}, body: any = {}) {
  const req: any = { query, params, body };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('productController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('returns products with pagination', async () => {
      const { req, res } = mockReqRes({ page: '1', limit: '10' });

      const mockDoc = { id: 'prod-1', data: () => ({ name: 'Test Product', price: 999, categoryName: 'Dental', brandName: 'TestBrand' }) };
      const mockSnapshot = { docs: [mockDoc] };

      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ data: () => ({ count: 1 }) }) }),
        get: vi.fn().mockResolvedValue(mockSnapshot),
      });

      await getAllProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          products: expect.arrayContaining([expect.objectContaining({ id: 'prod-1' })]),
          pagination: expect.objectContaining({ total: 1, page: 1 }),
        })
      );
    });

    it('returns cached products when available', async () => {
      const { req, res } = mockReqRes({ page: '1', limit: '10' });

      const cachedData = { products: [{ id: 'cached-1', name: 'Cached Product' }], pagination: { total: 1, page: 1, limit: 10, pages: 1 } };
      (cacheService.get as any).mockResolvedValue(cachedData);

      await getAllProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(cachedData);
      expect(cacheService.get).toHaveBeenCalled();
    });

    it('returns 504 on Firebase timeout', async () => {
      const { req, res } = mockReqRes({ page: '1', limit: '10' });

      (cacheService.get as any).mockRejectedValue(new Error('Firebase operation timed out'));

      await getAllProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(504);
    });
  });

  describe('getProductById', () => {
    it('returns product by id', async () => {
      const { req, res } = mockReqRes({}, { id: 'prod-1' });

      const mockDoc = { exists: true, id: 'prod-1', data: () => ({ name: 'Test Product', price: 999, categoryName: 'Dental' }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await getProductById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          product: expect.objectContaining({ id: 'prod-1', name: 'Test Product' }),
        })
      );
    });

    it('returns 404 for non-existent product', async () => {
      const { req, res } = mockReqRes({}, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createProduct', () => {
    it('creates product with name', async () => {
      const { req, res } = mockReqRes({}, {}, { name: 'New Product', price: 1999 });

      (db.collection as any).mockReturnValue({
        add: vi.fn().mockResolvedValue({ id: 'new-prod-id' }),
      });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          product: expect.objectContaining({ id: 'new-prod-id', name: 'New Product' }),
        })
      );
      expect(cacheService.invalidateProductsCache).toHaveBeenCalled();
    });

    it('returns 400 without product name', async () => {
      const { req, res } = mockReqRes({}, {}, { price: 1999 });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProduct', () => {
    it('updates existing product', async () => {
      const { req, res } = mockReqRes({}, { id: 'prod-1' }, { name: 'Updated Product' });

      const mockDoc = { exists: true };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: mockUpdate,
        }),
      });

      await updateProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), id: 'prod-1' }));
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('returns 404 for non-existent product', async () => {
      const { req, res } = mockReqRes({}, { id: 'nonexistent' }, { name: 'Updated' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteProduct', () => {
    it('deletes existing product', async () => {
      const { req, res } = mockReqRes({}, { id: 'prod-1' });

      const mockDoc = { exists: true };
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          delete: mockDelete,
        }),
      });

      await deleteProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), id: 'prod-1' }));
      expect(mockDelete).toHaveBeenCalled();
    });

    it('returns 404 for non-existent product', async () => {
      const { req, res } = mockReqRes({}, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
