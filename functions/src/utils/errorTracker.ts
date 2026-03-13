import logger from './logger';

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
let Sentry: any = null;

function initSentry() {
    if (sentryInitialized) return;
    sentryInitialized = true;

    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        logger.info('Sentry DSN not configured — error tracking is in log-only mode');
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
        logger.info('Sentry error tracking initialized');
    } catch (err) {
        logger.warn('Sentry package not installed. Run: npm install @sentry/node', { error: err });
    }
}

export const errorTracker = {
    /**
     * Initialize the error tracker. Call once at app startup.
     */
    init() {
        initSentry();
    },

    /**
     * Capture an error. Sends to Sentry if configured, always logs.
     */
    captureException(error: Error | unknown, context?: Record<string, any>) {
        // Always log locally
        logger.error('Tracked error', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            ...context,
        });

        // Forward to Sentry if available
        if (Sentry) {
            if (context) {
                Sentry.withScope((scope: any) => {
                    Object.entries(context).forEach(([key, value]) => {
                        scope.setExtra(key, value);
                    });
                    Sentry.captureException(error);
                });
            } else {
                Sentry.captureException(error);
            }
        }
    },

    /**
     * Capture a message (non-error event).
     */
    captureMessage(message: string, context?: Record<string, any>) {
        logger.warn(message, context);

        if (Sentry) {
            Sentry.captureMessage(message);
        }
    },
};
