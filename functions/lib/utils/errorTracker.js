"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorTracker = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * Error Tracker
 *
 * Lightweight error tracking abstraction. When SENTRY_DSN is configured,
 * forwards errors to Sentry. Otherwise, logs via Winston.
 *
 * To enable Sentry:
 * 1. npm install @sentry/node
 * 2. Set SENTRY_DSN environment variable
 * 3. Errors will automatically be forwarded
 */
let sentryInitialized = false;
let Sentry = null;
function initSentry() {
    if (sentryInitialized)
        return;
    sentryInitialized = true;
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        logger_1.default.info('Sentry DSN not configured — error tracking is in log-only mode');
        return;
    }
    try {
        // Dynamic import so Sentry is only loaded when configured
        Sentry = require('@sentry/node');
        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            tracesSampleRate: 0.1, // 10% of transactions
        });
        logger_1.default.info('Sentry error tracking initialized');
    }
    catch (err) {
        logger_1.default.warn('Sentry package not installed. Run: npm install @sentry/node', { error: err });
    }
}
exports.errorTracker = {
    /**
     * Initialize the error tracker. Call once at app startup.
     */
    init() {
        initSentry();
    },
    /**
     * Capture an error. Sends to Sentry if configured, always logs.
     */
    captureException(error, context) {
        // Always log locally
        logger_1.default.error('Tracked error', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ...context,
        });
        // Forward to Sentry if available
        if (Sentry) {
            if (context) {
                Sentry.withScope((scope) => {
                    Object.entries(context).forEach(([key, value]) => {
                        scope.setExtra(key, value);
                    });
                    Sentry.captureException(error);
                });
            }
            else {
                Sentry.captureException(error);
            }
        }
    },
    /**
     * Capture a message (non-error event).
     */
    captureMessage(message, context) {
        logger_1.default.warn(message, context);
        if (Sentry) {
            Sentry.captureMessage(message);
        }
    },
};
//# sourceMappingURL=errorTracker.js.map