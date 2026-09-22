import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cafkart.app',
  appName: 'CafKart',
  webDir: 'dist',

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Provides a fallback timeout
      launchAutoHide: false,    // Critical: Do not hide until React calls hide()
      backgroundColor: '#011f1a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      androidScaleType: 'CENTER', // Ensures consistent Android 12 sizing fallback
    },
  },
};

export default config;
