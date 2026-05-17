// @ts-ignore // csurf types may be missing in TS config
import csrf from 'csurf';
import type { Request, Response, NextFunction } from 'express';

const isProd = process.env.NODE_ENV === 'production';

// CSRF protection middleware - validates tokens on mutating requests
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
  },
});

// Expose token to client on safe GET requests
export function sendCsrfToken(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET') {
    res.cookie('csrf-token', (req as any).csrfToken(), {
      httpOnly: false,
      sameSite: isProd ? 'strict' : 'lax',
      secure: isProd,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
  next();
}