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

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getAllHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide, reorderHeroSlides } from '../../controllers/heroSlideController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, params: any = {}, query: any = {}) {
  const req: any = { body, params, query };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('heroSlideController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllHeroSlides', () => {
    it('returns hero slides', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = { id: 'slide-1', data: () => ({ title: 'Summer Sale', order: 1, isActive: true }) };
      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
        }),
      });

      await getAllHeroSlides(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          slides: expect.arrayContaining([expect.objectContaining({ title: 'Summer Sale' })]),
        })
      );
    });

    it('filters active slides', async () => {
      const { req, res } = mockReqRes({}, {}, { active: 'true' });

      (db.collection as any).mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ docs: [] }),
          }),
        }),
      });

      await getAllHeroSlides(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('createHeroSlide', () => {
    it('creates a hero slide', async () => {
      const { req, res } = mockReqRes({
        title: 'New Slide',
        subtitle: 'Check this out',
        image: 'https://example.com/slide.jpg',
      });

      (db.collection as any).mockReturnValue({
        add: vi.fn().mockResolvedValue({ id: 'new-slide-id' }),
      });

      await createHeroSlide(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Slide' })
      );
    });
  });

  describe('updateHeroSlide', () => {
    it('updates a hero slide', async () => {
      const { req, res } = mockReqRes({ title: 'Updated' }, { id: 'slide-1' });

      const mockUpdatedDoc = { id: 'slide-1', data: () => ({ title: 'Updated' }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          update: vi.fn().mockResolvedValue(undefined),
          get: vi.fn().mockResolvedValue(mockUpdatedDoc),
        }),
      });

      await updateHeroSlide(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('deleteHeroSlide', () => {
    it('deletes a hero slide', async () => {
      const { req, res } = mockReqRes({}, { id: 'slide-1' });

      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ delete: mockDelete }),
      });

      await deleteHeroSlide(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Hero slide deleted successfully' });
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('reorderHeroSlides', () => {
    it('reorders hero slides', async () => {
      const { req, res } = mockReqRes({
        slides: [{ id: 'slide-1', order: 2 }, { id: 'slide-2', order: 1 }],
      });

      const batchMock = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      (db as any).batch.mockReturnValue(batchMock);

      await reorderHeroSlides(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Hero slides reordered successfully' });
      expect(batchMock.commit).toHaveBeenCalled();
    });
  });
});
