import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alphadentkart.app',
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
    /* plugins configure here if needed, the core plugins are auto-registered */
    // '@capacitor/splash-screen',
    // '@capacitor/status-bar',
    // '@capacitor/geolocation',
    // '@capacitor/network',
    // '@capacitor/camera',
    // '@capacitor/file-system',
    // '@capacitor/local-notifications',
    // '@capacitor/webview',
    // '@capacitor/haptics',
    // '@capacitor/share',
    // '@capacitor/push-notifications',
    // '@capacitor/keyboard',
    // '@capacitor/app-launcher'
  }
};

export default config;
