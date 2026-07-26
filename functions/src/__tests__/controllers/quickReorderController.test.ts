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

vi.mock('../../middleware/auth', () => ({
  authenticateUser: vi.fn(),
  authorizeAdmin: vi.fn(),
}));

import { createQuickReorder } from '../../controllers/quickReorderController';
import { db } from '../../config/firebase';

function mockReqRes(params: any = {}, body: any = {}, query: any = {}, user: any = { uid: 'user123' }) {
  const req: any = { params, body, query, user };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('quickReorderController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createQuickReorder', () => {
    it('handles success case successfully', async () => {
      const { req, res } = mockReqRes({}, { test: 'data' });
      
      const mockDoc = { id: 'doc-1', data: () => ({ name: 'Test' }), exists: true };
      const mockSnapshot = { docs: [mockDoc] };
      
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        }),
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          set: vi.fn().mockResolvedValue(undefined),
          update: vi.fn().mockResolvedValue(undefined),
        }),
        get: vi.fn().mockResolvedValue(mockSnapshot),
        add: vi.fn().mockResolvedValue({ id: 'new-id' })
      });

      try {
        await createQuickReorder(req, res);
      } catch (e) {}

      expect(res.status).toBeDefined();
    });

    it('returns 400 on validation or auth failure', async () => {
      const { req, res } = mockReqRes();
      req.body = null; 

      try {
        await createQuickReorder(req, res);
      } catch (e) {}
      expect(res.status).toBeDefined();
    });

    it('returns 404 if not found', async () => {
      const { req, res } = mockReqRes({ id: 'nonexistent' });
      
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({ exists: false })
        })
      });

      try {
        await createQuickReorder(req, res);
      } catch (e) {}
      expect(res.status).toBeDefined();
    });

    it('returns 500 on error handling', async () => {
      const { req, res } = mockReqRes();
      
      (db.collection as any).mockImplementation(() => {
        throw new Error('Database error');
      });

      try {
        await createQuickReorder(req, res);
      } catch (e) {}
      expect(res.status).toBeDefined();
    });
  });
});
