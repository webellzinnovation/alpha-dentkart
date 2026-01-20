import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alphadentkart.app',
  appName: 'Alpha Dentkart',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      backgroundColor: '#ffffff',
      style: 'DARK',
      overlaysWebView: true,
    },
  },
};

export default config;
