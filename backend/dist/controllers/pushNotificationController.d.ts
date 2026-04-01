import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Register push notification token for authenticated user
 */
export declare function registerPushToken(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get all push tokens for authenticated user (for testing/admin)
 */
export declare function getUserPushTokens(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=pushNotificationController.d.ts.map