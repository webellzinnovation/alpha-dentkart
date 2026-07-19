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
    withTimeout: vi.fn((p: any) => p),
  };
});

vi.mock('../../utils/validation', () => ({
  userUpdateSchema: {
    parse: vi.fn((d: any) => d),
  },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getAllUsers, updateUser, deleteUser, updateUserByEmail } from '../../controllers/userController';
import { db } from '../../config/firebase';

function mockReqRes(body: any = {}, params: any = {}, query: any = {}) {
  const req: any = { body, params, query };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('userController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('returns paginated users', async () => {
      const { req, res } = mockReqRes({}, {}, { page: '1', limit: '10' });

      const mockDoc = {
        id: 'user-1',
        data: () => ({ name: 'Test User', email: 'test@test.com', createdAt: new Date().toISOString() }),
      };
      (db.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
      });

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.arrayContaining([expect.objectContaining({ id: 'user-1' })]),
          total: 1,
        })
      );
    });

    it('filters users by search term', async () => {
      const { req, res } = mockReqRes({}, {}, { search: 'john' });

      const mockDoc1 = { id: 'u1', data: () => ({ name: 'John Doe', email: 'john@test.com' }) };
      const mockDoc2 = { id: 'u2', data: () => ({ name: 'Jane Smith', email: 'jane@test.com' }) };
      (db.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [mockDoc1, mockDoc2] }),
      });

      await getAllUsers(req, res);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.users).toHaveLength(1);
      expect(callArgs.users[0].name).toBe('John Doe');
    });

    it('excludes password from response', async () => {
      const { req, res } = mockReqRes();

      const mockDoc = {
        id: 'user-1',
        data: () => ({ name: 'Test', email: 'test@test.com', password: 'hashed-pw', createdAt: new Date().toISOString() }),
      };
      (db.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [mockDoc] }),
      });

      await getAllUsers(req, res);

      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.users[0].password).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('updates user successfully', async () => {
      const { req, res } = mockReqRes({ name: 'Updated Name' }, { id: 'user-1' });

      const mockDoc = { exists: true, data: () => ({ name: 'Old Name' }) };
      const mockUpdatedDoc = { id: 'user-1', data: () => ({ name: 'Updated Name' }) };

      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn()
            .mockResolvedValueOnce(mockDoc)
            .mockResolvedValueOnce(mockUpdatedDoc),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await updateUser(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User updated successfully' })
      );
    });

    it('returns 404 for non-existent user', async () => {
      const { req, res } = mockReqRes({ name: 'Updated' }, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteUser', () => {
    it('deletes user successfully', async () => {
      const { req, res } = mockReqRes({}, { id: 'user-1' });

      const mockDoc = { exists: true };
      const mockDelete = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          delete: mockDelete,
        }),
      });

      await deleteUser(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
      expect(mockDelete).toHaveBeenCalled();
    });

    it('returns 404 for non-existent user', async () => {
      const { req, res } = mockReqRes({}, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUserByEmail', () => {
    it('updates existing user by email', async () => {
      const { req, res } = mockReqRes({ email: 'test@test.com', name: 'Updated' });

      const mockDoc = { id: 'user-1', ref: { update: vi.fn().mockResolvedValue(undefined) }, data: () => ({}) };
      (db.collection as any).mockReturnValue({
        where: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue({ docs: [mockDoc], empty: false }) }),
      });

      const batchMock = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      (db as any).batch.mockReturnValue(batchMock);

      await updateUserByEmail(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
    });

    it('returns 400 without email', async () => {
      const { req, res } = mockReqRes({ name: 'Updated' });

      await updateUserByEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
