import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE importing controller
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
    auth: { verifyIdToken: vi.fn() },
    withTimeout: vi.fn((p: any) => p),
    admin: { firestore: { FieldValue: { increment: vi.fn(), serverTimestamp: vi.fn(), arrayUnion: vi.fn() } } },
  };
});

vi.mock('../../utils/jwt', () => ({
  generateToken: vi.fn().mockReturnValue('mock-jwt-token'),
  verifyToken: vi.fn(),
}));

vi.mock('../../services/EmailService', () => ({
  emailService: {
    sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/validation', () => ({
  registerSchema: { parse: vi.fn((d: any) => d) },
  loginSchema: { parse: vi.fn((d: any) => d) },
  forgotPasswordSchema: { parse: vi.fn((d: any) => d) },
  resetPasswordSchema: { parse: vi.fn((d: any) => d) },
}));

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { register, login, logout, forgotPassword, resetPassword, me, updateProfile, verifyEmail, resendVerification, googleLogin } from '../../controllers/authController';
import { db, auth } from '../../config/firebase';
import { generateToken } from '../../utils/jwt';
import { emailService } from '../../services/EmailService';
import bcrypt from 'bcrypt';

// Helper to create mock request/response
function mockReqRes(body: any = {}, params: any = {}, user: any = undefined, query: any = {}) {
  const req: any = { body, params, query, user, cookies: {} };
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('authController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('registers a new user successfully', async () => {
      const { req, res } = mockReqRes({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
        phone: '1234567890',
      });

      // Mock empty snapshot (no existing user)
      const mockSnapshot = { empty: true, docs: [] };
      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
        add: vi.fn().mockResolvedValue({ id: 'new-user-id' }),
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'new-user-id', email: 'test@example.com' }),
          message: expect.any(String),
        })
      );
    });

    it('returns 409 for duplicate email', async () => {
      const { req, res } = mockReqRes({
        email: 'existing@example.com',
        password: 'Password123',
        name: 'Existing User',
      });

      const mockSnapshot = { empty: false, docs: [{ id: 'existing', data: () => ({ email: 'existing@example.com' }) }] };
      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
    });

    it('creates admin user with valid admin key', async () => {
      process.env.ADMIN_SECRET = 'admin-secret-key';
      const { req, res } = mockReqRes({
        email: 'admin@example.com',
        password: 'Password123',
        name: 'Admin User',
        adminKey: 'admin-secret-key',
      });

      const mockSnapshot = { empty: true, docs: [] };
      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
        add: vi.fn().mockResolvedValue({ id: 'admin-user-id' }),
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      delete process.env.ADMIN_SECRET;
    });

    it('returns 500 on Firebase timeout', async () => {
      const { req, res } = mockReqRes({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test',
      });

      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({
          ...db,
          limit: vi.fn().mockReturnValue({
            ...db,
            get: vi.fn().mockRejectedValue(new Error('Firebase operation timed out')),
          }),
        }),
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(504);
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const { req, res } = mockReqRes({ email: 'test@example.com', password: 'Password123' });

      const mockDoc = { id: 'user-1', data: () => ({ email: 'test@example.com', password: hashedPassword, role: 'user', name: 'Test' }) };
      const mockSnapshot = { empty: false, docs: [mockDoc] };

      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user-1', email: 'test@example.com' }),
        })
      );
      expect(generateToken).toHaveBeenCalled();
    });

    it('returns 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('DifferentPassword', 10);
      const { req, res } = mockReqRes({ email: 'test@example.com', password: 'Password123' });

      const mockDoc = { id: 'user-1', data: () => ({ email: 'test@example.com', password: hashedPassword, role: 'user' }) };
      const mockSnapshot = { empty: false, docs: [mockDoc] };

      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when user not found', async () => {
      const { req, res } = mockReqRes({ email: 'nonexistent@example.com', password: 'Password123' });

      const mockSnapshot = { empty: true, docs: [] };
      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns password_reset_required for users without password', async () => {
      const { req, res } = mockReqRes({ email: 'wpuser@example.com', password: 'Password123' });

      const mockDoc = { id: 'user-1', data: () => ({ email: 'wpuser@example.com', role: 'user', name: 'WP User' }) };
      const mockSnapshot = { empty: false, docs: [mockDoc] };

      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'password_reset_required' }));
    });
  });

  describe('logout', () => {
    it('clears session cookie', async () => {
      const { req, res } = mockReqRes();
      await logout(req, res);
      expect(res.clearCookie).toHaveBeenCalledWith('__session');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('forgotPassword', () => {
    it('sends reset email for existing user', async () => {
      const { req, res } = mockReqRes({ email: 'test@example.com' });

      const mockDoc = { id: 'user-1', data: () => ({ name: 'Test' }) };
      const mockSnapshot = { empty: false, docs: [mockDoc] };

      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
        doc: vi.fn().mockReturnValue({ ...db, set: vi.fn().mockResolvedValue(undefined) }),
      });

      await forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
    });

    it('returns same message for non-existent email (security)', async () => {
      const { req, res } = mockReqRes({ email: 'nonexistent@example.com' });

      const mockSnapshot = { empty: true, docs: [] };
      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
      });

      await forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: expect.any(String) });
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      const { req, res } = mockReqRes({ token: 'valid-token', newPassword: 'NewPass123' });

      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const mockResetDoc = {
        exists: true,
        data: () => ({ userId: 'user-1', expiresAt: futureDate, used: false }),
      };
      const mockUserDoc = { exists: true, data: () => ({ name: 'Test' }) };

      (db.collection as any).mockImplementation((col: string) => {
        if (col === 'password_resets') {
          return {
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(mockResetDoc),
              update: vi.fn().mockResolvedValue(undefined),
            }),
          };
        }
        return {
          doc: vi.fn().mockReturnValue({
            update: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue(mockUserDoc),
          }),
        };
      });

      await resetPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
    });

    it('returns 400 for invalid token', async () => {
      const { req, res } = mockReqRes({ token: 'invalid-token', newPassword: 'NewPass123' });

      const mockResetDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockResetDoc) }),
      });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('me', () => {
    it('returns user data when authenticated', async () => {
      const { req, res } = mockReqRes({}, {}, { id: 'user-1', email: 'test@example.com' });

      const mockDoc = { exists: true, id: 'user-1', data: () => ({ email: 'test@example.com', name: 'Test', role: 'user' }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await me(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({ id: 'user-1', email: 'test@example.com' }),
        })
      );
    });

    it('returns 401 when not authenticated', async () => {
      const { req, res } = mockReqRes({}, {}, undefined);

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 404 when user not found', async () => {
      const { req, res } = mockReqRes({}, {}, { id: 'nonexistent' });

      const mockDoc = { exists: false };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({ get: vi.fn().mockResolvedValue(mockDoc) }),
      });

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('updates profile successfully', async () => {
      const { req, res } = mockReqRes({ name: 'Updated Name' }, {}, { id: 'user-1' });

      const mockDoc = { exists: true, data: () => ({ name: 'Test' }) };
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await updateProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Profile updated successfully' }));
    });

    it('removes restricted fields from update', async () => {
      const { req, res } = mockReqRes({ email: 'hacker@evil.com', role: 'admin', password: 'hacked' }, {}, { id: 'user-1' });

      const mockDoc = { exists: true, data: () => ({}) };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: mockUpdate,
        }),
      });

      await updateProfile(req, res);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.not.objectContaining({ email: 'hacker@evil.com', role: 'admin', password: 'hacked' })
      );
    });

    it('sets verificationStatus to pending on professional update', async () => {
      const { req, res } = mockReqRes({ dentalDoctorInfo: { licenseNo: '123' } }, {}, { id: 'user-1' });

      const mockDoc = { exists: true, data: () => ({}) };
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      (db.collection as any).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockDoc),
          update: mockUpdate,
        }),
      });

      await updateProfile(req, res);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ verificationStatus: 'pending', isVerified: false })
      );
    });
  });

  describe('verifyEmail', () => {
    it('verifies email with valid token', async () => {
      const { req, res } = mockReqRes({}, {}, undefined, { token: 'valid-verification-token' });

      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const mockVerDoc = {
        exists: true,
        data: () => ({ userId: 'user-1', expiresAt: futureDate, used: false, email: 'test@example.com' }),
      };

      (db.collection as any).mockImplementation((col: string) => {
        if (col === 'email_verifications') {
          return {
            doc: vi.fn().mockReturnValue({
              get: vi.fn().mockResolvedValue(mockVerDoc),
              update: vi.fn().mockResolvedValue(undefined),
            }),
          };
        }
        return {
          doc: vi.fn().mockReturnValue({ update: vi.fn().mockResolvedValue(undefined) }),
        };
      });

      await verifyEmail(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: expect.stringContaining('verified') });
    });

    it('returns 400 without token', async () => {
      const { req, res } = mockReqRes({}, {}, undefined, {});

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('googleLogin', () => {
    it('logs in new Google user', async () => {
      const { req, res } = mockReqRes({ idToken: 'google-id-token' });

      (auth.verifyIdToken as any).mockResolvedValue({
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/photo.jpg',
        email_verified: true,
      });

      const mockSnapshot = { empty: true, docs: [] };
      (db.collection as any).mockReturnValue({
        ...db,
        where: vi.fn().mockReturnValue({ ...db, limit: vi.fn().mockReturnValue({ ...db, get: vi.fn().mockResolvedValue(mockSnapshot) }) }),
        add: vi.fn().mockResolvedValue({ id: 'google-user-id' }),
      });

      await googleLogin(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({ email: 'google@example.com' }),
        })
      );
    });

    it('returns 401 for invalid Google token', async () => {
      const { req, res } = mockReqRes({ idToken: 'invalid-token' });

      (auth.verifyIdToken as any).mockRejectedValue(new Error('Invalid token'));

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
