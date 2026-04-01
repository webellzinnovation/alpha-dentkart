"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
exports.NotificationService = {
    /**
     * Send a push notification to a specific user
     */
    async sendToUser(userId, title, body, data = {}) {
        try {
            const userDoc = await firebase_1.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                logger_1.default.warn(`User ${userId} not found.`);
                return false;
            }
            const user = userDoc.data();
            const fcmToken = user?.fcmToken;
            if (!fcmToken) {
                logger_1.default.warn(`User ${userId} does not have an FCM token.`);
                return false;
            }
            const message = {
                notification: {
                    title,
                    body
                },
                data: {
                    ...data,
                    click_action: 'FLUTTER_NOTIFICATION_CLICK' // For backward compatibility if needed
                },
                token: fcmToken
            };
            const response = await firebase_admin_1.default.messaging().send(message);
            logger_1.default.info('Successfully sent message:', response);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error sending push notification:', error);
            return false;
        }
    },
    /**
     * Broadcast a message to all users (Promotions)
     */
    async broadcast(title, body, data = {}) {
        try {
            // For broadcasting, you can use Topics in Firebase for better performance
            // Here we simulate it by sending to 'all_users' topic or similar strategy
            const message = {
                notification: {
                    title,
                    body
                },
                topic: 'promotions',
                data
            };
            const response = await firebase_admin_1.default.messaging().send(message);
            logger_1.default.info('Successfully sent broadcast:', response);
            return true;
        }
        catch (error) {
            logger_1.default.error('Error sending broadcast:', error);
            return false;
        }
    }
};
//# sourceMappingURL=NotificationService.js.map