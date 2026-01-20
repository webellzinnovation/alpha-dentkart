
// Push Notification Service - Currently disabled to prevent startup crashes 
// until google-services.json is provided by the user.

export const NotificationService = {
    async init() {
        console.log('Push Notifications are currently disabled.');
    },

    async registerNotifications() {
        return;
    },

    addListeners() {
        return;
    },

    async saveTokenToBackend(token: string) {
        console.log('Token capture ignored (Service Disabled):', token);
    }
};
