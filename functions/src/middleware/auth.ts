import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    user?: {
        id: string; // Firebase UID
        role: string;
        email: string;
        userType?: string;
    };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.__session;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.__session;

    if (token) {
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
        } catch (err) {
            // Token invalid, but continue anyway
        }
    }
    next();
}
