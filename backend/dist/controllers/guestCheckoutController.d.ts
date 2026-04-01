import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
    };
}
export declare const createGuestSession: (req: Request, res: Response) => Promise<void>;
export declare const validateGuestSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createGuestOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getGuestOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateGuestOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getGuestOrderStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const convertGuestOrder: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getGuestOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=guestCheckoutController.d.ts.map