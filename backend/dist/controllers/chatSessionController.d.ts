import { Request, Response } from 'express';
export declare const createSession: (req: Request, res: Response) => Promise<void>;
export declare const getSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllSessions: (req: Request, res: Response) => Promise<void>;
export declare const addMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateSessionStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=chatSessionController.d.ts.map