"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = exports.authLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const isProd = process.env.NODE_ENV === 'production';
const rateLimitOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
};
// General API rate limiter — tight in production, relaxed in dev
exports.apiLimiter = (0, express_rate_limit_1.default)({
    ...rateLimitOptions,
    max: isProd ? 200 : 3000,
    message: { error: 'Too many requests from this IP, please try again later.' },
});
// Strict limiter for authentication endpoints — prevents brute force
exports.authLimiter = (0, express_rate_limit_1.default)({
    ...rateLimitOptions,
    max: isProd ? 10 : 100,
    message: { error: 'Too many login attempts, please try again in 15 minutes.' },
    skipSuccessfulRequests: true,
});
// AI endpoint limiter
exports.aiLimiter = (0, express_rate_limit_1.default)({
    ...rateLimitOptions,
    max: isProd ? 20 : 100,
    message: { error: 'AI request limit exceeded, please try again later.' },
});
//# sourceMappingURL=rateLimiter.js.map