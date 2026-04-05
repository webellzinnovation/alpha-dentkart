"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.validateCsrfToken = validateCsrfToken;
const crypto_1 = __importDefault(require("crypto"));
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
function generateCsrfToken(req, res, next) {
    if (!req.cookies[CSRF_COOKIE_NAME]) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }
    next();
}
function validateCsrfToken(req, res, next) {
    if (SAFE_METHODS.includes(req.method)) {
        return next();
    }
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }
    next();
}
//# sourceMappingURL=csrf.js.map