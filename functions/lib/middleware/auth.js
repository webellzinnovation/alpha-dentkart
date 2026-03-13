"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireAdmin = requireAdmin;
exports.optionalAuth = optionalAuth;
const jwt_1 = require("../utils/jwt");
function authenticateToken(req, res, next) {
    const token = req.cookies.__session;
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}
function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
function optionalAuth(req, res, next) {
    const token = req.cookies.__session;
    if (token) {
        try {
            const decoded = (0, jwt_1.verifyToken)(token);
            req.user = decoded;
        }
        catch (err) {
            // Token invalid, but continue anyway
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map