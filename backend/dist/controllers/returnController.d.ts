import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
    };
}
export declare function createReturnRequest(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUserReturnRequests(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getReturnRequest(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllReturnRequests(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function approveReturnRequest(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function processRefund(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getReturnPolicy(req: Request, res: Response): Promise<void>;
export {};
//# sourceMappingURL=returnController.d.ts.map