/**
 * Audit Logging Utility
 * Logs security-critical events for compliance, security monitoring, and debugging
 *
 * Usage:
 *   await logAuditEvent(req, user, 'login', 'auth', 'success', { method: 'pin' });
 *   await logAuditEvent(req, user, 'pin_change', 'account', 'success');
 *   await logAuditEvent(req, null, 'login_failed', 'auth', 'failure', { reason: 'invalid_pin' });
 */

import {getSupabaseClient} from './db.ts';

/**
 * Event categories for audit logs
 */
export const AUDIT_CATEGORIES = {
  AUTH: 'auth', // Login, logout, token refresh
  ACCOUNT: 'account', // Profile changes, PIN changes, account deletion
  PAYMENT: 'payment', // Subscriptions, payments, refunds
  SECURITY: 'security', // Rate limiting, suspicious activity
  ADMIN: 'admin', // Administrative actions
} as const;

export type AuditCategory =
  (typeof AUDIT_CATEGORIES)[keyof typeof AUDIT_CATEGORIES];

/**
 * Event status values
 */
export const AUDIT_STATUS = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export type AuditStatus = (typeof AUDIT_STATUS)[keyof typeof AUDIT_STATUS];

/**
 * Common event types
 */
export const AUDIT_EVENTS = {
  // Authentication
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  VERIFICATION_CODE_SENT: 'verification_code_sent',
  VERIFICATION_CODE_VERIFIED: 'verification_code_verified',
  VERIFICATION_FAILED: 'verification_failed',

  // Account Management
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_DELETED: 'account_deleted',
  PIN_CHANGED: 'pin_change',
  PIN_CHANGE_FAILED: 'pin_change_failed',
  PROFILE_UPDATED: 'profile_updated',

  // Payment Operations
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_METHOD_ADDED: 'payment_method_added',
  PAYMENT_METHOD_UPDATED: 'payment_method_updated',
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  PAYMENT_FAILED: 'payment_failed',

  // Security Events
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  INVALID_TOKEN: 'invalid_token',
  WEAK_PIN_REJECTED: 'weak_pin_rejected',
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

/**
 * Extract IP address from request headers
 */
function getClientIP(req: Request): string | null {
  // Check X-Forwarded-For (proxy/load balancer)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP in comma-separated list
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Check CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP.trim();
  }

  return null;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string | null {
  return req.headers.get('user-agent') || null;
}

/**
 * Extract or generate request ID for tracing
 */
function getRequestID(req: Request): string | null {
  // Check if request already has an ID (from gateway/proxy)
  const existingID = req.headers.get('x-request-id');
  if (existingID) {
    return existingID;
  }

  // Generate simple request ID (timestamp + random)
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log an audit event
 *
 * @param req - Request object
 * @param user - User object (null if unauthenticated)
 * @param eventType - Type of event (e.g., 'login', 'pin_change')
 * @param eventCategory - Category of event ('auth', 'account', 'payment', 'security')
 * @param eventStatus - Status of event ('success', 'failure', 'warning', 'info')
 * @param eventData - Additional event-specific data
 * @returns Promise<void>
 *
 * @example
 * // Log successful login
 * await logAuditEvent(req, user, 'login', 'auth', 'success', {
 *   method: 'pin',
 *   remember_me: false
 * });
 *
 * @example
 * // Log failed login attempt
 * await logAuditEvent(req, null, 'login_failed', 'auth', 'failure', {
 *   phone: '+15551234567',
 *   reason: 'invalid_pin',
 *   attempts: 3
 * });
 *
 * @example
 * // Log subscription creation
 * await logAuditEvent(req, user, 'subscription_created', 'payment', 'success', {
 *   plan: 'monthly',
 *   amount: 999,
 *   currency: 'usd'
 * });
 */
export async function logAuditEvent(
  req: Request,
  user: {id: string} | null,
  eventType: string,
  eventCategory: AuditCategory,
  eventStatus: AuditStatus,
  eventData?: Record<string, any>,
): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Extract request metadata
    const ipAddress = getClientIP(req);
    const userAgent = getUserAgent(req);
    const requestId = getRequestID(req);

    // Sanitize event data (remove sensitive info)
    const sanitizedData = eventData ? sanitizeEventData(eventData) : null;

    // Insert audit log
    const {error} = await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      event_type: eventType,
      event_category: eventCategory,
      event_status: eventStatus,
      event_data: sanitizedData,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_id: requestId,
    });

    if (error) {
      // Log to console but don't throw - audit logging should not break app flow
      console.error('Failed to log audit event:', {
        eventType,
        eventCategory,
        eventStatus,
        error: error.message,
      });
    }
  } catch (error) {
    // Catch-all to prevent audit logging from breaking app
    console.error('Audit logging error:', error);
  }
}

/**
 * Sanitize event data to remove sensitive information
 * Removes: passwords, PINs, tokens, credit card numbers, etc.
 */
function sanitizeEventData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'pin',
    'password',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'api_key',
    'credit_card',
    'card_number',
    'cvv',
    'ssn',
    'pin_hash',
    'password_hash',
  ];

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive data
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeEventData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Log authentication event (convenience function)
 */
export async function logAuthEvent(
  req: Request,
  user: {id: string} | null,
  eventType: string,
  success: boolean,
  additionalData?: Record<string, any>,
): Promise<void> {
  await logAuditEvent(
    req,
    user,
    eventType,
    AUDIT_CATEGORIES.AUTH,
    success ? AUDIT_STATUS.SUCCESS : AUDIT_STATUS.FAILURE,
    additionalData,
  );
}

/**
 * Log account event (convenience function)
 */
export async function logAccountEvent(
  req: Request,
  user: {id: string},
  eventType: string,
  success: boolean,
  additionalData?: Record<string, any>,
): Promise<void> {
  await logAuditEvent(
    req,
    user,
    eventType,
    AUDIT_CATEGORIES.ACCOUNT,
    success ? AUDIT_STATUS.SUCCESS : AUDIT_STATUS.FAILURE,
    additionalData,
  );
}

/**
 * Log payment event (convenience function)
 */
export async function logPaymentEvent(
  req: Request,
  user: {id: string},
  eventType: string,
  success: boolean,
  additionalData?: Record<string, any>,
): Promise<void> {
  await logAuditEvent(
    req,
    user,
    eventType,
    AUDIT_CATEGORIES.PAYMENT,
    success ? AUDIT_STATUS.SUCCESS : AUDIT_STATUS.FAILURE,
    additionalData,
  );
}

/**
 * Log security event (convenience function)
 */
export async function logSecurityEvent(
  req: Request,
  user: {id: string} | null,
  eventType: string,
  status: AuditStatus = AUDIT_STATUS.WARNING,
  additionalData?: Record<string, any>,
): Promise<void> {
  await logAuditEvent(
    req,
    user,
    eventType,
    AUDIT_CATEGORIES.SECURITY,
    status,
    additionalData,
  );
}

/**
 * Get recent audit events for a user
 */
export async function getUserAuditLog(
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();

    const {data, error} = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {ascending: false})
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch user audit log:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching user audit log:', error);
    return [];
  }
}

/**
 * Get audit events by category
 */
export async function getAuditLogByCategory(
  category: AuditCategory,
  limit: number = 100,
  offset: number = 0,
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();

    const {data, error} = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_category', category)
      .order('created_at', {ascending: false})
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to fetch audit logs by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching audit logs by category:', error);
    return [];
  }
}

/**
 * Get failed events for security monitoring
 */
export async function getFailedEvents(
  minutes: number = 60,
  limit: number = 100,
): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();

    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

    const {data, error} = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_status', 'failure')
      .gte('created_at', since)
      .order('created_at', {ascending: false})
      .limit(limit);

    if (error) {
      console.error('Failed to fetch failed events:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching failed events:', error);
    return [];
  }
}

/**
 * Cleanup old audit logs (call from cron job)
 */
export async function cleanupOldAuditLogs(): Promise<number> {
  try {
    const supabase = getSupabaseClient();

    const {data, error} = await supabase.rpc('cleanup_old_audit_logs');

    if (error) {
      console.error('Failed to cleanup old audit logs:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error cleaning up old audit logs:', error);
    return 0;
  }
}
