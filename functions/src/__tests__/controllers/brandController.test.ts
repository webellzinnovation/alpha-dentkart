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
    batch: vi.fn().mockReturnValue({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    }),
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

vi.mock('../../services/cacheService', () => ({
  cacheService: {
    invalidateBrandsCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getAllBrands, createBrand, updateBrand, deleteBrand } from '../../controllers/brandController';
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

describe('brandController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBrands', () => {
    it('returns brands sorted by name', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { id: 'brand-1', data: () => ({ name: 'Dentsply' }) };
      const mockSnapshot = { docs: [mockDoc] };
      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot),
        }),
      });

      await getAllBrands(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          brands: expect.arrayContaining([expect.objectContaining({ name: 'Dentsply' })]),
        })
      );
    });

    it('returns featured brands when query param set', async () => {
      const { req, res } = mockReqRes({}, {}, { featured: 'true' });

      const mockDoc = { id: 'brand-1', data: () => ({ name: 'Dentsply', isFeatured: true }) };
      const mockSnapshot = { docs: [mockDoc] };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      });

      await getAllBrands(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('createBrand', () => {
    it('creates brand with name', async () => {
      const { req, res } = mockReqRes({}, { name: 'New Brand' });

      (db.collection as any).mockReturnValue({
        add: vi.fn().mockResolvedValue({ id: 'new-brand-id' }),
      });

      await createBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: expect.objectContaining({ name: 'New Brand' }),
        })
      );
      expect(cacheService.invalidateBrandsCache).toHaveBeenCalled();
    });

    it('returns 400 without name', async () => {
      const { req, res } = mockReqRes({}, {});

      await createBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateBrand', () => {
    it('updates existing brand', async () => {
      const { req, res } = mockReqRes({ id: 'brand-1' }, { name: 'Updated' });

      const mockDoc = { exists: true };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await updateBrand(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('returns 404 for non-existent brand', async () => {
      const { req, res } = mockReqRes({ id: 'nonexistent' }, { name: 'Updated' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await updateBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteBrand', () => {
    it('deletes existing brand', async () => {
      const { req, res } = mockReqRes({ id: 'brand-1' });

      const mockDoc = { exists: true };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await deleteBrand(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
      expect(cacheService.invalidateBrandsCache).toHaveBeenCalled();
    });

    it('returns 404 for non-existent brand', async () => {
      const { req, res } = mockReqRes({ id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await deleteBrand(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
