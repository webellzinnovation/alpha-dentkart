import { Request, Response } from 'express';
export declare const getSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAdminSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateSettings: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=settingsController.d.ts.map