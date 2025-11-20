/**
 * Analytics & Error Tracking Service
 * Integrates with Sentry for error tracking and Firebase Analytics for events
 */

import * as Sentry from '@sentry/react-native';
import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

// Sentry DSN (replace with actual value in production)
const SENTRY_DSN = 'https://your-sentry-dsn@sentry.io/project-id';

/**
 * Initialize analytics and error tracking
 */
export function initializeAnalytics(): void {
  // Initialize Sentry for error tracking
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableInExpoDevelopment: false,
    debug: __DEV__,

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 20% in production

    // Session replay
    integrations: [
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['api.pruuf.com', /^\//],
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],

    // Before send hook to filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from error reports
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }

      // Filter out user PIN and phone from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            delete breadcrumb.data.pin;
            delete breadcrumb.data.phone;
            delete breadcrumb.data.password;
          }
          return breadcrumb;
        });
      }

      return event;
    },
  });

  console.log('Analytics initialized');
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, phone: string): void {
  // Set Sentry user context
  Sentry.setUser({
    id: userId,
    // Don't include phone for privacy
  });

  // Set Firebase Analytics user ID
  analytics().setUserId(userId);

  console.log('User context set:', userId);
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
  analytics().setUserId(null);
  console.log('User context cleared');
}

/**
 * Track an event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  // Firebase Analytics
  analytics().logEvent(eventName, properties);

  // Sentry breadcrumb
  Sentry.addBreadcrumb({
    category: 'event',
    message: eventName,
    level: 'info',
    data: properties,
  });

  console.log('Event tracked:', eventName, properties);
}

/**
 * Track a screen view
 */
export function trackScreenView(screenName: string): void {
  analytics().logScreenView({
    screen_name: screenName,
    screen_class: screenName,
  });

  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Screen: ${screenName}`,
    level: 'info',
  });

  console.log('Screen view tracked:', screenName);
}

/**
 * Track an error (non-fatal)
 */
export function trackError(error: Error, context?: Record<string, any>): void {
  // Sentry
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });

  // Firebase Analytics (as event)
  analytics().logEvent('error', {
    error_message: error.message,
    error_name: error.name,
    ...context,
  });

  console.error('Error tracked:', error, context);
}

/**
 * Track a critical error (fatal)
 */
export function trackCriticalError(
  error: Error,
  context?: Record<string, any>
): void {
  Sentry.captureException(error, {
    level: 'fatal',
    contexts: {
      custom: context,
    },
  });

  console.error('Critical error tracked:', error, context);
}

/**
 * Set custom context/tags for error tracking
 */
export function setContext(
  key: string,
  value: Record<string, any> | string
): void {
  if (typeof value === 'string') {
    Sentry.setTag(key, value);
  } else {
    Sentry.setContext(key, value);
  }
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, operation: string): any {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}

/**
 * Finish a performance transaction
 */
export function finishTransaction(transaction: any): void {
  transaction.finish();
}

// Event tracking helpers

export const Events = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGOUT: 'logout',
  PIN_RESET: 'pin_reset',

  // Member actions
  CHECK_IN_SUCCESS: 'check_in_success',
  CHECK_IN_LATE: 'check_in_late',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  CHECK_IN_TIME_CHANGED: 'check_in_time_changed',

  // Contact actions
  MEMBER_INVITED: 'member_invited',
  MEMBER_ACCEPTED: 'member_accepted',
  INVITE_RESENT: 'invite_resent',
  RELATIONSHIP_REMOVED: 'relationship_removed',

  // Payments
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_METHOD_UPDATED: 'payment_method_updated',
  PAYMENT_FAILED: 'payment_failed',

  // Notifications
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',
  PUSH_TOKEN_REGISTERED: 'push_token_registered',

  // Settings
  FONT_SIZE_CHANGED: 'font_size_changed',
  NOTIFICATION_SETTINGS_CHANGED: 'notification_settings_changed',
  TIMEZONE_CHANGED: 'timezone_changed',

  // Help & Support
  HELP_VIEWED: 'help_viewed',
  SUPPORT_CONTACTED: 'support_contacted',

  // App lifecycle
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
};

/**
 * Track user action
 */
export function trackUserAction(
  action: string,
  properties?: Record<string, any>
): void {
  trackEvent(action, {
    ...properties,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track conversion event
 */
export function trackConversion(
  conversionName: string,
  value?: number,
  currency?: string
): void {
  analytics().logEvent('conversion', {
    conversion_name: conversionName,
    value,
    currency: currency || 'USD',
  });
}

/**
 * Track purchase event (for Stripe payments)
 */
export function trackPurchase(
  amount: number,
  currency: string,
  subscriptionId: string
): void {
  analytics().logPurchase({
    value: amount,
    currency,
    items: [
      {
        item_id: subscriptionId,
        item_name: 'Pruuf Monthly Subscription',
        item_category: 'subscription',
        price: amount,
        quantity: 1,
      },
    ],
  });
}
