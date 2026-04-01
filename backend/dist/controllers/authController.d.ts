import { Request, Response } from 'express';
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function me(req: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function verifyEmail(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function resendVerification(req: any, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map