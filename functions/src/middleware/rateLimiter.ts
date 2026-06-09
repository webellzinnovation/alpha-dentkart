import rateLimit from 'express-rate-limit';

// Detect production: check NODE_ENV OR Firebase Functions environment
const isProd = process.env.NODE_ENV === 'production' || 
               !!(process.env.FUNCTION_NAME || process.env.FIREBASE_CONFIG);

const rateLimitOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { ip: false },
};

// General API rate limiter — tight in production, relaxed in dev
export const apiLimiter = rateLimit({
    ...rateLimitOptions,
    max: isProd ? 200 : 3000,
    message: { error: 'Too many requests from this IP, please try again later.' },
} as any);

// Strict limiter for authentication endpoints — prevents brute force
export const authLimiter = rateLimit({
    ...rateLimitOptions,
    max: isProd ? 10 : 100,
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    skipSuccessfulRequests: true,
} as any);

// AI endpoint limiter
export const aiLimiter = rateLimit({
    ...rateLimitOptions,
    max: isProd ? 20 : 100,
    message: { error: 'AI request limit exceeded, please try again later.' },
} as any);
