import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function getJwtSecret(): string {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable is REQUIRED in production. Set a secure random string (min 32 chars).');
    }

    const devSecretFile = '.jwt_secret_dev';
    const fs = require('fs');
    const path = require('path');
    const secretPath = path.join(process.cwd(), devSecretFile);

    if (fs.existsSync(secretPath)) {
        return fs.readFileSync(secretPath, 'utf8').trim();
    }

    const devSecret = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(secretPath, devSecret);
    console.log('⚠️  Auto-generated dev JWT secret saved to .jwt_secret_dev');
    return devSecret;
}

const JWT_SECRET = getJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
    id: string;
    role: string;
    email: string;
    userType?: string;
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
