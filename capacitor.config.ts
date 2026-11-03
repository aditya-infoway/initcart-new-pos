import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.superadmin.app",
  appName: "POS Branch Panel",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
};

export default config;
