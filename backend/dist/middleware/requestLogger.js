"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = __importDefault(require("../utils/logger"));
function requestLogger(req, res, next) {
    const start = Date.now();
    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent')?.substring(0, 100),
        };
        if (res.statusCode >= 500) {
            logger_1.default.error('Request failed', logData);
        }
        else if (res.statusCode >= 400) {
            logger_1.default.warn('Client error', logData);
        }
        else {
            logger_1.default.info('Request completed', logData);
        }
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map