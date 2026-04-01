import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const submitVerification: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserVerifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVerificationById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllVerifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateVerificationStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteVerification: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVerificationStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getVerificationAuditLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllVerificationAuditLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const uploadVerificationFile: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
declare const _default: {
    submitVerification: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getUserVerifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getVerificationById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllVerifications: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateVerificationStatus: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteVerification: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getVerificationStats: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getVerificationAuditLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllVerificationAuditLogs: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
    uploadVerificationFile: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
};
export default _default;
//# sourceMappingURL=verificationController.d.ts.map