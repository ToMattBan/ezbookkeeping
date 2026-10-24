import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bills.ezbookkeping',
  appName: 'EzBookKeeping',
  webDir: 'dist',
  server: {
    // the app is served from http://localhost inside the device, so plain-http servers are not blocked as mixed content
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    // sends axios/fetch requests through the native HTTP stack, so the server doesn't need CORS headers
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
