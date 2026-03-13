import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'alpha-dentkart-api' },
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    transports: [
        // Console transport — always active
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? combine(json())
                : combine(colorize(), devFormat),
        }),

        // Error file transport — production only
        ...(process.env.NODE_ENV === 'production'
            ? [
                new winston.transports.File({
                    filename: path.join(process.cwd(), 'logs', 'error.log'),
                    level: 'error',
                    maxsize: 5 * 1024 * 1024, // 5MB
                    maxFiles: 5,
                }),
                new winston.transports.File({
                    filename: path.join(process.cwd(), 'logs', 'combined.log'),
                    maxsize: 10 * 1024 * 1024, // 10MB
                    maxFiles: 5,
                }),
            ]
            : []),
    ],
});

export default logger;
