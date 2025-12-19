/**
 * App Configuration Constants
 */

export const CONFIG = {
  // API Configuration
  API_BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://api.pruuf.me',

  // Supabase Configuration
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',

  // App Settings
  VERIFICATION_CODE_LENGTH: 6,
  PIN_LENGTH: 4,
  VERIFICATION_CODE_EXPIRY_MINUTES: 10,
  RESEND_CODE_COOLDOWN_SECONDS: 30,

  // Trial Settings
  TRIAL_DAYS: 30,

  // Rate Limits
  MAX_VERIFICATION_ATTEMPTS: 3,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 5,
};

/**
 * RevenueCat Configuration
 * Product identifiers must match those created in RevenueCat dashboard
 */
export const REVENUECAT_CONFIG = {
  // Product identifiers (must match RevenueCat dashboard)
  MONTHLY_PRODUCT_ID: 'monthly_subscription',
  ANNUAL_PRODUCT_ID: 'annual_subscription',

  // Entitlement identifier (for checking subscription status)
  ENTITLEMENT_ID: 'pro',

  // Display information
  MONTHLY_DISPLAY_NAME: 'Monthly Subscription',
  ANNUAL_DISPLAY_NAME: 'Annual Subscription',
};

/**
 * Pricing Information
 * These are display values only - actual prices come from App Store/Play Store
 */
export const PRICING = {
  MONTHLY: {
    price: 4.99,
    displayPrice: '$4.99',
    interval: 'month',
    description: 'Billed monthly',
  },
  ANNUAL: {
    price: 50.0,
    displayPrice: '$50',
    interval: 'year',
    description: 'Billed annually',
    savings: '$9.88/year', // (4.99 * 12) - 50 = $9.88 savings
    savingsPercent: '17%',
  },
};

export const TWILIO_CONFIG = {
  // Twilio configuration (used on backend)
  ACCOUNT_SID: 'YOUR_TWILIO_ACCOUNT_SID',
  AUTH_TOKEN: 'YOUR_TWILIO_AUTH_TOKEN',
  PHONE_NUMBER: '+1XXXXXXXXXX',
};
