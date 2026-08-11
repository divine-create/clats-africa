import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clats.app',
  appName: 'CLATS',
  webDir: 'out',
  server: {
    url: 'https://app.clats.org',
    cleartext: true
  }
};

export default config;
