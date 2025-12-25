/**
 * Error Tracking Service
 * Centralized error tracking using Sentry
 *
 * Features:
 * - Automatic error capture for runtime errors
 * - Manual error reporting for caught errors
 * - User context for debugging
 * - Breadcrumbs for navigation and actions
 * - Performance monitoring for API calls
 */

import * as Sentry from '@sentry/react-native';
import {Platform} from 'react-native';
import {SENTRY_DSN} from '../constants/config';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  Fatal = 'fatal',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
}

/**
 * Error categories for grouping
 */
export enum ErrorCategory {
  API = 'api',
  Auth = 'auth',
  Navigation = 'navigation',
  Storage = 'storage',
  Payment = 'payment',
  Notification = 'notification',
  CheckIn = 'checkin',
  Redux = 'redux',
  Unknown = 'unknown',
}

/**
 * User context for error reports
 */
interface UserContext {
  id: string;
  email?: string;
  is_member?: boolean;
}

/**
 * Initialize Sentry error tracking
 * Should be called early in app startup (App.tsx)
 */
export function initializeErrorTracking(): void {
  if (__DEV__) {
    console.log('[ErrorTracking] Running in development mode - Sentry disabled');
    return;
  }

  if (!SENTRY_DSN) {
    console.warn('[ErrorTracking] SENTRY_DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    debug: __DEV__,
    beforeSend(event) {
      // Don't send events in development
      if (__DEV__) {
        console.log('[ErrorTracking] Would send event:', event);
        return null;
      }
      return event;
    },
    integrations: [
      // React Navigation integration (if available)
      Sentry.reactNavigationIntegration(),
    ],
  });

  // Set default tags
  Sentry.setTag('platform', Platform.OS);
  Sentry.setTag('platform_version', Platform.Version.toString());
}

/**
 * Set user context for error reports
 * Call after user logs in
 */
export function setUserContext(user: UserContext): void {
  if (__DEV__) {
    console.log('[ErrorTracking] Setting user context:', user.id);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  Sentry.setTag('is_member', user.is_member?.toString() || 'unknown');
}

/**
 * Clear user context
 * Call after user logs out
 */
export function clearUserContext(): void {
  if (__DEV__) {
    console.log('[ErrorTracking] Clearing user context');
    return;
  }

  Sentry.setUser(null);
}

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: Error | string,
  options?: {
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  },
): string {
  const {
    category = ErrorCategory.Unknown,
    severity = ErrorSeverity.Error,
    tags = {},
    extra = {},
  } = options || {};

  // Always log to console in development
  if (__DEV__) {
    console.error(`[ErrorTracking] ${category}:`, error);
    console.log('Extra context:', extra);
    return 'dev-error-id';
  }

  const errorInstance = typeof error === 'string' ? new Error(error) : error;

  Sentry.withScope(scope => {
    scope.setLevel(severity as Sentry.SeverityLevel);
    scope.setTag('category', category);

    // Add custom tags
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });

    // Add extra context
    Object.entries(extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
  });

  const eventId = Sentry.captureException(errorInstance);
  return eventId || 'unknown';
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  options?: {
    level?: ErrorSeverity;
    category?: ErrorCategory;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  },
): void {
  const {
    level = ErrorSeverity.Info,
    category = ErrorCategory.Unknown,
    tags = {},
    extra = {},
  } = options || {};

  if (__DEV__) {
    console.log(`[ErrorTracking] ${level.toUpperCase()}: ${message}`);
    return;
  }

  Sentry.withScope(scope => {
    scope.setLevel(level as Sentry.SeverityLevel);
    scope.setTag('category', category);

    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(key, value);
    });

    Object.entries(extra).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    Sentry.captureMessage(message);
  });
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  options?: {
    category?: string;
    level?: ErrorSeverity;
    data?: Record<string, any>;
  },
): void {
  const {category = 'default', level = ErrorSeverity.Info, data} = options || {};

  if (__DEV__) {
    console.log(`[Breadcrumb] ${category}: ${message}`, data || '');
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level: level as Sentry.SeverityLevel,
    data,
  });
}

/**
 * Add navigation breadcrumb
 */
export function addNavigationBreadcrumb(
  from: string,
  to: string,
  params?: Record<string, any>,
): void {
  addBreadcrumb(`Navigated from ${from} to ${to}`, {
    category: 'navigation',
    data: {from, to, params},
  });
}

/**
 * Capture API error with request details
 */
export function captureAPIError(
  error: Error,
  options: {
    endpoint: string;
    method: string;
    statusCode?: number;
    requestBody?: any;
    responseBody?: any;
  },
): string {
  return captureException(error, {
    category: ErrorCategory.API,
    severity: ErrorSeverity.Error,
    tags: {
      endpoint: options.endpoint,
      method: options.method,
      status_code: options.statusCode?.toString() || 'unknown',
    },
    extra: {
      request_body: options.requestBody,
      response_body: options.responseBody,
    },
  });
}

/**
 * Capture Redux action error
 */
export function captureReduxError(
  error: Error,
  action: {type: string; payload?: any},
): string {
  return captureException(error, {
    category: ErrorCategory.Redux,
    severity: ErrorSeverity.Error,
    tags: {
      action_type: action.type,
    },
    extra: {
      action_payload: action.payload,
    },
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string,
): Sentry.Span | null {
  if (__DEV__) {
    console.log(`[Performance] Starting transaction: ${name} (${operation})`);
    return null;
  }

  return Sentry.startSpan({name, op: operation}, () => null);
}

/**
 * Wrap a function with error boundary
 */
export function withErrorBoundary<T>(
  fn: () => T,
  errorHandler?: (error: Error) => void,
): T | null {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    captureException(err);
    errorHandler?.(err);
    return null;
  }
}

/**
 * Wrap an async function with error tracking
 */
export async function withAsyncErrorTracking<T>(
  fn: () => Promise<T>,
  options?: {
    category?: ErrorCategory;
    errorHandler?: (error: Error) => void;
  },
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    captureException(err, {category: options?.category});
    options?.errorHandler?.(err);
    return null;
  }
}

/**
 * Get Sentry instance for advanced usage
 */
export function getSentry(): typeof Sentry {
  return Sentry;
}

export default {
  initializeErrorTracking,
  setUserContext,
  clearUserContext,
  captureException,
  captureMessage,
  addBreadcrumb,
  addNavigationBreadcrumb,
  captureAPIError,
  captureReduxError,
  startTransaction,
  withErrorBoundary,
  withAsyncErrorTracking,
  getSentry,
  ErrorSeverity,
  ErrorCategory,
};
