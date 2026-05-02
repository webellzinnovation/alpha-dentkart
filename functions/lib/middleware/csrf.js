"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfProtection = void 0;
exports.sendCsrfToken = sendCsrfToken;
// @ts-ignore // csurf types may be missing in TS config
const csurf_1 = __importDefault(require("csurf"));
const CSRF_IGNORE_ROUTES = ['/api/v1/sync'];
function shouldSkipCSRF(req) {
    return CSRF_IGNORE_ROUTES.some(route => req.path.startsWith(route));
}
// CSRF protection middleware - validates tokens on mutating requests
exports.csrfProtection = (0, csurf_1.default)({
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    },
});
// Expose token to client on safe GET requests
function sendCsrfToken(req, res, next) {
    if (req.method === 'GET') {
        res.cookie('XSRF-TOKEN', req.csrfToken(), {
            httpOnly: false,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
        });
    }
    next();
}
//# sourceMappingURL=csrf.js.map