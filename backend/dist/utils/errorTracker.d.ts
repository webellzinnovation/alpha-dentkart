export declare const errorTracker: {
    /**
     * Initialize the error tracker. Call once at app startup.
     */
    init(): void;
    /**
     * Capture an error. Sends to Sentry if configured, always logs.
     */
    captureException(error: Error | unknown, context?: Record<string, any>): void;
    /**
     * Capture a message (non-error event).
     */
    captureMessage(message: string, context?: Record<string, any>): void;
};
//# sourceMappingURL=errorTracker.d.ts.map