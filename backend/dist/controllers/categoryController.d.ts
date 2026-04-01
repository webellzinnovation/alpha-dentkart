import { Request, Response } from 'express';
export declare function getAllCategories(req: Request, res: Response): Promise<void>;
export declare function createCategory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCategory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteCategory(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=categoryController.d.ts.map