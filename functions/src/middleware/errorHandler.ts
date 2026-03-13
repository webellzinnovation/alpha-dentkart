import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { errorTracker } from '../utils/errorTracker';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    // Forward to error tracker (Sentry when configured)
    errorTracker.captureException(err, {
        method: req.method,
        url: req.originalUrl,
        code: err.code,
    });

    // Firebase Auth errors
    if (err.code?.startsWith('auth/')) {
        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
            code: err.code,
            message: err.message
        });
    }

    // Firestore errors
    if (err.code === 'permission-denied') {
        return res.status(403).json({
            success: false,
            error: 'Permission denied',
            message: 'You do not have permission to access this resource'
        });
    }

    if (err.code === 'not-found') {
        return res.status(404).json({
            success: false,
            error: 'Not found',
            message: 'The requested resource was not found'
        });
    }

    if (err.code === 'already-exists') {
        return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: 'This resource already exists'
        });
    }

    // Validation errors (Zod)
    if (err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: err.errors
        });
    }

    // JWT errors (deprecated but kept for compatibility during transition if any)
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
}
