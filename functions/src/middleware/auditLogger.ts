import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import logger from '../utils/logger';

/**
 * Audit Logger Middleware
 * 
 * Logs admin write operations (POST, PUT, PATCH, DELETE) to the
 * `audit_logs` Firestore collection for compliance and debugging.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction) {
    // Only log mutating requests
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutatingMethods.includes(req.method)) {
        return next();
    }

    // Only log if user is authenticated (admin or regular user)
    const user = (req as any).user;
    if (!user) {
        return next();
    }

    // Capture response on finish
    const originalEnd = res.end;
    res.end = function (this: Response, ...args: any[]) {
        // Log asynchronously — don't block the response
        const auditEntry = {
            userId: user.id,
            userEmail: user.email,
            userRole: user.role || 'user',
            action: req.method,
            resource: req.originalUrl,
            statusCode: res.statusCode,
            ip: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent')?.substring(0, 150),
            timestamp: new Date().toISOString(),
            // Include request body summary (exclude sensitive fields)
            payload: sanitizePayload(req.body),
        };

        // Fire and forget — don't slow down the response
        db.collection('audit_logs')
            .add(auditEntry)
            .catch((err) => {
                logger.error('Failed to write audit log', { error: err, auditEntry });
            });

        return originalEnd.apply(this, args as any);
    } as any;

    next();
}

/**
 * Remove sensitive fields from the request payload before logging.
 */
function sanitizePayload(body: any): Record<string, any> | null {
    if (!body || typeof body !== 'object') return null;

    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard', 'cvv', 'ssn'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(body)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = '[Object]';
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}
