import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}
export declare const createCoupon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllCoupons: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCouponByCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCoupon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCoupon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validateCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const applyCoupon: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCouponAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=couponController.d.ts.map