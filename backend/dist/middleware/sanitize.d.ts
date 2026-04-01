import { Request, Response, NextFunction } from 'express';
/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent XSS injection attacks.
 */
export declare function sanitizeInput(req: Request, _res: Response, next: NextFunction): void;
//# sourceMappingURL=sanitize.d.ts.map