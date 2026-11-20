import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.magiccell.app',
  appName: 'Magic Cell',
  webDir: 'dist/magic-cell/browser',
  // Solo desarrollo: permite HTTP hacia la API local. En producción se usa HTTPS (RNF04).
  server: { androidScheme: 'http', cleartext: true },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_icon_config_sample' }
  }
};

export default config;
