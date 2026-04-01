import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
        userType: string;
        email: string;
    };
}
export declare function getProductReviews(req: Request, res: Response): Promise<void>;
export declare function getUserReviews(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createReview(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateReview(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteReview(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markReviewHelpful(req: Request, res: Response): Promise<void>;
export declare function getAllReviews(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function moderateReview(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=reviewController.d.ts.map