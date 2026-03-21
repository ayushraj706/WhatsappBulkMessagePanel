import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.basekey.messenger',
  appName: 'BaseKey',
  webDir: 'out', // Next.js static export folder
  server: {
    url: 'https://whatsapp-bulk-message-panel.vercel.app', // Aapki asali Vercel URL
    allowNavigation: ['*']
  }
};

export default config;

