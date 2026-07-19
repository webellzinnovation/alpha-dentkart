import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from '../../middleware/errorHandler';
import type { Request, Response, NextFunction } from 'express';

// Mock dependencies
vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../utils/errorTracker', () => ({
  errorTracker: { captureException: vi.fn(), captureMessage: vi.fn() },
}));

describe('errorHandler middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  it('handles Firebase Auth errors with 401', () => {
    const err = { code: 'auth/user-not-found', message: 'User not found' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Authentication failed',
        code: 'auth/user-not-found',
      })
    );
  });

  it('handles permission-denied errors with 403', () => {
    const err = { code: 'permission-denied', message: 'Permission denied' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Permission denied' })
    );
  });

  it('handles not-found errors with 404', () => {
    const err = { code: 'not-found', message: 'Not found' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(404);
  });

  it('handles already-exists errors with 409', () => {
    const err = { code: 'already-exists', message: 'Already exists' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(409);
  });

  it('handles ZodError with 400', () => {
    const err = { name: 'ZodError', errors: [{ message: 'Invalid input' }] };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Validation failed' })
    );
  });

  it('handles JsonWebTokenError with 401', () => {
    const err = { name: 'JsonWebTokenError', message: 'invalid signature' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('handles TokenExpiredError with 401', () => {
    const err = { name: 'TokenExpiredError', message: 'jwt expired' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('handles generic errors with 500', () => {
    const err = { message: 'Something went wrong' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Something went wrong' })
    );
  });

  it('handles errors with custom status code', () => {
    const err = { status: 429, message: 'Too many requests' };
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(429);
  });

  it('handles errors without message', () => {
    const err = {};
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
