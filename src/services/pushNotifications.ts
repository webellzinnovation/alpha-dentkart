import { PushNotifications, Token } from '@capacitor/push-notifications';
import api from '../../utils/api';
import { Capacitor } from '@capacitor/core';

export class PushNotificationService {
  static async initialize() {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // Register with FCM
      await PushNotifications.register();
    } else {
      console.warn('Push notifications permission denied');
    }

    // Listen for token refresh
    PushNotifications.addListener('registration', async (token: Token) => {
      // Send token to your backend
      try {
        await api.post('/api/v1/push-notifications/register', {
          token: token.value,
          platform: Capacitor.getPlatform()
        });
      } catch (e) {
        console.error('Failed to register push token:', e);
      }
    });

    // Handle incoming notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      // Handle notification while app is in foreground
    });

    // Handle notification clicks
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed:', notification);
      // Navigate to specific screen when tapped
    });
  }

  static async removeListener() {
    PushNotifications.removeAllListeners();
  }
}