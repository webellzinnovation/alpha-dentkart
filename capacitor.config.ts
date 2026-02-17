
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
  '@capacitor/splash-screen',
  '@capacitor/status-bar',
  '@capacitor/geolocation',
  '@capacitor/network',
  '@capacitor/camera',
  '@capacitor/file-system',
  '@capacitor/local-notifications',
  '@capacitor/webview',
  '@capacitor/haptics',
  '@capacitor/share',
  '@capacitor/push-notifications',
  '@capacitor/keyboard',
  '@capacitor/app-launcher'
  ],
android: {
  buildOptions: {
    webContentCompression: 'true'
  }
},
ios: {
  buildOptions: {
    webContentCompression: 'true'
  }
}
};

export default config;
