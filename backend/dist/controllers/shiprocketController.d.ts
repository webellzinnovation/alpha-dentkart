import { Request, Response } from 'express';
export declare const checkPincodeServiceability: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getShippingRates: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEstimatedDelivery: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createShiprocketOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const trackShipment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelShiprocketOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAvailableCouriers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const calculateShippingCharges: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shiprocketController.d.ts.map