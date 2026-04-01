import { Request, Response, NextFunction } from 'express';
/**
 * Audit Logger Middleware
 *
 * Logs admin write operations (POST, PUT, PATCH, DELETE) to the
 * `audit_logs` Firestore collection for compliance and debugging.
 */
export declare function auditLogger(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auditLogger.d.ts.map