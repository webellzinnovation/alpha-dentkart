import admin from 'firebase-admin';
import { db } from '../config/firebase'; // Firestore
import logger from '../utils/logger';

export const NotificationService = {
    /**
     * Send a push notification to a specific user
     */
    async sendToUser(userId: string, title: string, body: string, data: any = {}) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();

            if (!userDoc.exists) {
                logger.warn(`User ${userId} not found.`);
                return false;
            }

            const user = userDoc.data();
            const fcmToken = user?.fcmToken;

            if (!fcmToken) {
                logger.warn(`User ${userId} does not have an FCM token.`);
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

            const response = await admin.messaging().send(message);
            logger.info('Successfully sent message:', response);
            return true;
        } catch (error) {
            logger.error('Error sending push notification:', error);
            return false;
        }
    },

    /**
     * Broadcast a message to all users (Promotions)
     */
    async broadcast(title: string, body: string, data: any = {}) {
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

            const response = await admin.messaging().send(message);
            logger.info('Successfully sent broadcast:', response);
            return true;
        } catch (error) {
            logger.error('Error sending broadcast:', error);
            return false;
        }
    }
};
