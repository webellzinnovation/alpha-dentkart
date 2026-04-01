"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const { combine, timestamp, printf, colorize, json, errors } = winston_1.default.format;
// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});
// Create logger instance
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'alpha-dentkart-api' },
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
    transports: [
        // Console transport — always active
        new winston_1.default.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? combine(json())
                : combine(colorize(), devFormat),
        }),
        // Error file transport — production only
        ...(process.env.NODE_ENV === 'production'
            ? [
                new winston_1.default.transports.File({
                    filename: path_1.default.join(process.cwd(), 'logs', 'error.log'),
                    level: 'error',
                    maxsize: 5 * 1024 * 1024, // 5MB
                    maxFiles: 5,
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(process.cwd(), 'logs', 'combined.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                }),
            ]
            : []),
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map