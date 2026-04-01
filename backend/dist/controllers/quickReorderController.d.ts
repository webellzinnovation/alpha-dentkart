import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createQuickReorder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserReorders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getReorderById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const cancelReorder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getReorderStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRecommendedReorders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const _default: {
    createQuickReorder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getUserReorders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getReorderById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    cancelReorder: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getReorderStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getRecommendedReorders: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
};
export default _default;
//# sourceMappingURL=quickReorderController.d.ts.map