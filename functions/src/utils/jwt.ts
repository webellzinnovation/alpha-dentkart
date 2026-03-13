import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Fail hard at startup if JWT_SECRET is missing — prevents silent auth bypass in production
if (!JWT_SECRET) {
    throw new Error(
        '❌ FATAL: JWT_SECRET environment variable is not set. ' +
        'Set a strong random string (min 32 chars) in your .env file before starting the server.'
    );
}

export interface JWTPayload {
    id: string;
    role: string;
    email: string;
    userType?: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload;
}
