import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }
    next();
}

export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
    if (SAFE_METHODS.includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }

    next();
}
