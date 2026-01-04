/**
 * Expo Configuration for Pruuf
 * Dynamic configuration file that replaces native iOS/Android settings
 *
 * @see https://docs.expo.dev/versions/latest/config/app/
 */

module.exports = {
  expo: {
    name: 'Pruuf',
    slug: 'pruuf',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'pruuf',

    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#4CAF50',
    },

    assetBundlePatterns: ['**/*'],

    ios: {
      bundleIdentifier: 'me.pruuf.pruuf',
      buildNumber: '1',
      supportsTablet: false,
      infoPlist: {
        NSFaceIDUsageDescription:
          'Pruuf uses Face ID for secure authentication',
        NSLocationWhenInUseUsageDescription:
          'Pruuf may use your location for check-in verification',
        UIBackgroundModes: ['remote-notification'],
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },

    android: {
      package: 'com.pruuf',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#4CAF50',
      },
      permissions: ['INTERNET', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED'],
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    plugins: [
      'expo-secure-store',
      [
        'expo-notifications',
        {
          // Notification icon for Android (optional - uses app icon if not specified)
          // icon: './assets/notification-icon.png',
          color: '#4CAF50',
          // Custom notification sounds (optional)
          // sounds: ['./assets/sounds/notification.wav'],
        },
      ],
    ],

    extra: {
      // Supabase Configuration (from EXPO_PUBLIC_ env vars)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

      // API Configuration
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,

      // Feature Flags
      enableDevTools: process.env.EXPO_PUBLIC_ENABLE_DEV_TOOLS === 'true',

      // EAS Configuration
      eas: {
        projectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID || '',
      },
    },

    owner: 'wesquire',

    updates: {
      fallbackToCacheTimeout: 0,
    },

    runtimeVersion: {
      policy: 'sdkVersion',
    },
  },
};
