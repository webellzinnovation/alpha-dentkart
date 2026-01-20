import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const NotificationService = {
    /**
     * Send a push notification to a specific user
     */
    async sendToUser(userId: string, title: string, body: string, data: any = {}) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { fcmToken: true }
            });

            if (!user || !user.fcmToken) {
                console.warn(`User ${userId} does not have an FCM token.`);
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
                token: user.fcmToken
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return true;
        } catch (error) {
            console.error('Error sending push notification:', error);
            return false;
        }
    },

    /**
     * Broadcast a message to all users (Promotions)
     */
    async broadcast(title: string, body: string, data: any = {}) {
        try {
            // For broadcasting, you can use Topics in Firebase for better performance
            // Here we simulate it by sending to 'all_users' topic
            const message = {
                notification: {
                    title,
                    body
                },
                topic: 'promotions',
                data
            };

            const response = await admin.messaging().send(message);
            console.log('Successfully sent broadcast:', response);
            return true;
        } catch (error) {
            console.error('Error sending broadcast:', error);
            return false;
        }
    }
};
