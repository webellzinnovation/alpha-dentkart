export declare const NotificationService: {
    /**
     * Send a push notification to a specific user
     */
    sendToUser(userId: string, title: string, body: string, data?: any): Promise<boolean>;
    /**
     * Broadcast a message to all users (Promotions)
     */
    broadcast(title: string, body: string, data?: any): Promise<boolean>;
};
//# sourceMappingURL=NotificationService.d.ts.map