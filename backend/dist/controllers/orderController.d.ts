import { Request, Response } from 'express';
export declare function createOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getMyOrders(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAllOrders(req: Request, res: Response): Promise<void>;
export declare function updateOrderTracking(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orderController.d.ts.map