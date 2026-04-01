import { Request, Response } from 'express';
export declare const sendCustomNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendTrackingNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const sendOrderStatusNotification: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notificationsController.d.ts.map