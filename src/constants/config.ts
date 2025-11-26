/**
 * App Configuration Constants
 */

export const CONFIG = {
  // API Configuration
  API_BASE_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://api.pruuf.app',

  // Supabase Configuration
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: __DEV__
    ? 'pk_test_YOUR_TEST_KEY'
    : 'pk_live_YOUR_LIVE_KEY',

  // App Settings
  VERIFICATION_CODE_LENGTH: 6,
  PIN_LENGTH: 4,
  VERIFICATION_CODE_EXPIRY_MINUTES: 10,
  RESEND_CODE_COOLDOWN_SECONDS: 30,

  // Trial Settings
  TRIAL_DAYS: 30,
  SUBSCRIPTION_PRICE: '$2.99/month',

  // Rate Limits
  MAX_VERIFICATION_ATTEMPTS: 3,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 5,
};

export const TWILIO_CONFIG = {
  // Twilio configuration (used on backend)
  ACCOUNT_SID: 'YOUR_TWILIO_ACCOUNT_SID',
  AUTH_TOKEN: 'YOUR_TWILIO_AUTH_TOKEN',
  PHONE_NUMBER: '+1XXXXXXXXXX',
};
