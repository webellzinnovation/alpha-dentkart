import { Request, Response } from 'express';
export declare function updateUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUserByEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllUsers(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=userController.d.ts.map