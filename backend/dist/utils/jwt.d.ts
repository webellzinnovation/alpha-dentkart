export interface JWTPayload {
    id: string;
    role: string;
    email: string;
    userType?: string;
}
export declare function generateToken(payload: JWTPayload): string;
export declare function verifyToken(token: string): JWTPayload;
//# sourceMappingURL=jwt.d.ts.map