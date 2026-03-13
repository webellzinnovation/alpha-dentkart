"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
/**
 * Recursively strip dangerous HTML/script content from all string values.
 * Prevents XSS attacks on input data.
 */
function stripHtml(value) {
    if (typeof value === 'string') {
        return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    if (Array.isArray(value)) {
        return value.map(stripHtml);
    }
    if (value !== null && typeof value === 'object') {
        const cleaned = {};
        for (const [key, val] of Object.entries(value)) {
            cleaned[key] = stripHtml(val);
        }
        return cleaned;
    }
    return value;
}
/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent XSS injection attacks.
 */
function sanitizeInput(req, _res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = stripHtml(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        const cleaned = stripHtml(req.query);
        for (const key in req.query) {
            delete req.query[key];
        }
        Object.assign(req.query, cleaned);
    }
    if (req.params && typeof req.params === 'object') {
        const cleaned = stripHtml(req.params);
        for (const key in req.params) {
            delete req.params[key];
        }
        Object.assign(req.params, cleaned);
    }
    next();
}
//# sourceMappingURL=sanitize.js.map