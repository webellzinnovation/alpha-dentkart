import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const calculateDeliveryEstimation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDeliveryHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDeliveryAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const checkPincodeServiceability: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getShippingCost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getCartDeliveryEstimate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    calculateDeliveryEstimation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getDeliveryHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getDeliveryAnalytics: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    checkPincodeServiceability: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getShippingCost: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getCartDeliveryEstimate: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=deliveryEstimationController.d.ts.map