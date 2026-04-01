import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}
export declare function createShipment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function trackShipment(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getShippingRates(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function checkPincodeServiceability(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUserOrderTracking(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllShipments(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=shippingController.d.ts.map