import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adk.app',
  appName: 'Alpha Dentkart',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  ios: {
    scheme: 'alphadentkart'
  },
  android: {
    backgroundColor: '#DD3B5F'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#DD3B5F',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#DD3B5F',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#DD3B5F',
    },
    Camera: {
      // Used for verification document uploads
    },
    Network: {
      // Auto-registered, no config needed
    },
    Share: {
      // Auto-registered, no config needed
    },
    Haptics: {
      // Auto-registered, no config needed
    },
  }
};

export default config;
