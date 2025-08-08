import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vrisham.customerapp',
  appName: 'Vrisham Customer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'http://192.168.1.10:3001',
      'http://localhost:3001',
      'http://10.0.2.2:3001'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
