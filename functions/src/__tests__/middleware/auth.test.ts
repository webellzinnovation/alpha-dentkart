import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateToken, requireAdmin, optionalAuth } from '../../middleware/auth';

// Mock the jwt module
vi.mock('../../utils/jwt', () => ({
  verifyToken: vi.fn(),
  generateToken: vi.fn(),
}));

import { verifyToken } from '../../utils/jwt';

describe('auth middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      cookies: {},
      user: undefined,
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('authenticateToken', () => {
    it('returns 401 when no token is provided', () => {
      authenticateToken(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next() with valid token', () => {
      const decoded = { id: 'user-123', role: 'user', email: 'test@test.com' };
      (verifyToken as any).mockReturnValue(decoded);
      mockReq.cookies.__session = 'valid-token';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('returns 403 when token is invalid', () => {
      (verifyToken as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockReq.cookies.__session = 'invalid-token';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when token is expired', () => {
      (verifyToken as any).mockImplementation(() => {
        throw new Error('jwt expired');
      });
      mockReq.cookies.__session = 'expired-token';

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('returns 403 when user is not admin', () => {
      mockReq.user = { id: 'user-123', role: 'user', email: 'test@test.com' };
      requireAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when no user is set', () => {
      mockReq.user = undefined;
      requireAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('calls next() when user is admin', () => {
      mockReq.user = { id: 'admin-123', role: 'admin', email: 'admin@test.com' };
      requireAdmin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('calls next() without setting user when no token', () => {
      optionalAuth(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('sets user when valid token is provided', () => {
      const decoded = { id: 'user-123', role: 'user', email: 'test@test.com' };
      (verifyToken as any).mockReturnValue(decoded);
      mockReq.cookies.__session = 'valid-token';

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalled();
    });

    it('calls next() even with invalid token (does not block)', () => {
      (verifyToken as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockReq.cookies.__session = 'invalid-token';

      optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });
});
