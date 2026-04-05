import { Request, Response, NextFunction } from 'express';
export declare function generateCsrfToken(req: Request, res: Response, next: NextFunction): void;
export declare function validateCsrfToken(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
//# sourceMappingURL=csrf.d.ts.map