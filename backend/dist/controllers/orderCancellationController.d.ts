import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const cancelOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const bulkCancelOrders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCancellationReasons: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getOrderCancellationHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOrderForCancellation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    cancelOrder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    bulkCancelOrders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getCancellationReasons: (req: AuthRequest, res: Response) => Promise<void>;
    getOrderCancellationHistory: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getOrderForCancellation: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=orderCancellationController.d.ts.map