/**
 * App Configuration Constants
 *
 * Note: Supabase configuration is handled in src/services/supabase.ts
 * using Constants.expoConfig.extra from app.config.js
 */

import Constants from 'expo-constants';

// Get API base URL from Expo config or fall back to defaults
const apiBaseUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  (__DEV__ ? 'http://localhost:3000' : 'https://api.pruuf.me');

export const CONFIG = {
  // API Configuration (from environment via app.config.js)
  API_BASE_URL: apiBaseUrl,

  // App Settings
  VERIFICATION_CODE_LENGTH: 6,
  PIN_LENGTH: 4,
  VERIFICATION_CODE_EXPIRY_MINUTES: 10,
  RESEND_CODE_COOLDOWN_SECONDS: 30,

  // Rate Limits
  MAX_VERIFICATION_ATTEMPTS: 3,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 5,
};

/**
 * Sentry Error Tracking Configuration
 * DSN should be set in environment or replaced with actual value
 */
export const SENTRY_DSN = process.env.SENTRY_DSN || '';

/**
 * Error Tracking Settings
 */
export const ERROR_TRACKING_CONFIG = {
  // Enable/disable error tracking
  enabled: !__DEV__,

  // Sample rate for performance monitoring (0.0 to 1.0)
  tracesSampleRate: 0.2,

  // Session tracking interval in ms
  sessionTrackingIntervalMs: 30000,
};
