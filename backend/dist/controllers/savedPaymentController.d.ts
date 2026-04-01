import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const savePaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserPaymentMethods: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPaymentMethodById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deletePaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const setDefaultPaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updatePaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPaymentMethodsByGateway: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getDefaultPaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPaymentMethodStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const validatePaymentToken: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    savePaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getUserPaymentMethods: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getPaymentMethodById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deletePaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    setDefaultPaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getDefaultPaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updatePaymentMethod: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getPaymentMethodsByGateway: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getPaymentMethodStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    validatePaymentToken: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=savedPaymentController.d.ts.map