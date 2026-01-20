import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const NotificationService = {
    async init() {
        try {
            if (Capacitor.getPlatform() === 'web') {
                console.log('Push notifications not supported on web.');
                return;
            }

            // Wrap in try-catch to prevent app crash if Firebase is not configured
            await this.registerNotifications();
            this.addListeners();
        } catch (err) {
            console.error('NotificationService init failed (likely missing Firebase config):', err);
        }
    },

    async registerNotifications() {
        try {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.warn('Push notification permissions denied.');
                return;
            }

            await PushNotifications.register();
        } catch (err) {
            console.error('PushNotifications.register() failed:', err);
        }
    },

    addListeners() {
        PushNotifications.addListener('registration', async (token) => {
            console.log('Push registration success, token: ' + token.value);
            await this.saveTokenToBackend(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
        });
    },

    async saveTokenToBackend(token: string) {
        try {
            // Get user from local storage (assuming they are logged in)
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const user = JSON.parse(userStr);
            await axios.post(`${API_URL}/notifications/save-token`, {
                userId: user.id,
                token: token
            });
            console.log('FCM Token saved to backend');
        } catch (err) {
            console.error('Failed to save FCM token:', err);
        }
    }
};
