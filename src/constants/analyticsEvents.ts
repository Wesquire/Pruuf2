/**
 * Analytics Event Constants
 * Item 35: Add Analytics Events Throughout App (MEDIUM)
 *
 * Centralized analytics event definitions
 */

/**
 * Screen view events
 */
export const ScreenEvents = {
  // Auth screens
  PHONE_ENTRY_SCREEN: 'screen_phone_entry',
  VERIFICATION_CODE_SCREEN: 'screen_verification_code',
  CREATE_PIN_SCREEN: 'screen_create_pin',
  CONFIRM_PIN_SCREEN: 'screen_confirm_pin',
  FONT_SIZE_SCREEN: 'screen_font_size',

  // Onboarding screens
  TRIAL_WELCOME_SCREEN: 'screen_trial_welcome',
  ADD_MEMBER_SCREEN: 'screen_add_member',
  REVIEW_MEMBER_SCREEN: 'screen_review_member',
  INVITE_SENT_SCREEN: 'screen_invite_sent',
  ENTER_INVITE_CODE_SCREEN: 'screen_enter_invite_code',

  // Dashboard screens
  MEMBER_DASHBOARD: 'screen_member_dashboard',
  CONTACT_DASHBOARD: 'screen_contact_dashboard',

  // Settings screens
  MEMBER_SETTINGS: 'screen_member_settings',
  CONTACT_SETTINGS: 'screen_contact_settings',
  NOTIFICATION_SETTINGS: 'screen_notification_settings',

  // Detail screens
  MEMBER_DETAIL: 'screen_member_detail',
  CONTACT_DETAIL: 'screen_contact_detail',
  CHECK_IN_HISTORY: 'screen_check_in_history',

  // Other screens
  MEMBER_CONTACTS: 'screen_member_contacts',
} as const;

/**
 * User action events
 */
export const UserActionEvents = {
  // Auth actions
  PHONE_SUBMITTED: 'action_phone_submitted',
  CODE_VERIFIED: 'action_code_verified',
  PIN_CREATED: 'action_pin_created',
  FONT_SIZE_SELECTED: 'action_font_size_selected',
  LOGIN_SUCCESS: 'action_login_success',
  LOGOUT: 'action_logout',

  // Biometric actions
  BIOMETRIC_ENROLLED: 'action_biometric_enrolled',
  BIOMETRIC_DISABLED: 'action_biometric_disabled',
  BIOMETRIC_AUTH_SUCCESS: 'action_biometric_auth_success',
  BIOMETRIC_AUTH_FAILED: 'action_biometric_auth_failed',

  // Member actions
  MEMBER_INVITED: 'action_member_invited',
  INVITE_CODE_ENTERED: 'action_invite_code_entered',
  INVITE_ACCEPTED: 'action_invite_accepted',
  CHECK_IN_COMPLETED: 'action_check_in_completed',
  CHECK_IN_TIME_UPDATED: 'action_check_in_time_updated',
  RELATIONSHIP_REMOVED: 'action_relationship_removed',

  // Notification actions
  NOTIFICATION_PERMISSION_GRANTED: 'action_notification_permission_granted',
  NOTIFICATION_PERMISSION_DENIED: 'action_notification_permission_denied',
  NOTIFICATION_RECEIVED: 'action_notification_received',
  NOTIFICATION_TAPPED: 'action_notification_tapped',

  // Settings actions
  REMINDER_ENABLED: 'action_reminder_enabled',
  REMINDER_DISABLED: 'action_reminder_disabled',
  ACCOUNT_DELETED: 'action_account_deleted',

  // Payment actions
  SUBSCRIPTION_STARTED: 'action_subscription_started',
  SUBSCRIPTION_CANCELLED: 'action_subscription_cancelled',
  PAYMENT_METHOD_ADDED: 'action_payment_method_added',

  // UI actions
  SEARCH_PERFORMED: 'action_search_performed',
  FILTER_APPLIED: 'action_filter_applied',
  REFRESH_TRIGGERED: 'action_refresh_triggered',
  RETRY_ATTEMPTED: 'action_retry_attempted',

  // Tutorial actions
  TUTORIAL_STARTED: 'action_tutorial_started',
  TUTORIAL_COMPLETED: 'action_tutorial_completed',
  TUTORIAL_SKIPPED: 'action_tutorial_skipped',
} as const;

/**
 * Error events
 */
export const ErrorEvents = {
  // Auth errors
  PHONE_VERIFICATION_FAILED: 'error_phone_verification_failed',
  CODE_VERIFICATION_FAILED: 'error_code_verification_failed',
  PIN_CREATION_FAILED: 'error_pin_creation_failed',
  LOGIN_FAILED: 'error_login_failed',

  // API errors
  API_REQUEST_FAILED: 'error_api_request_failed',
  NETWORK_ERROR: 'error_network_error',
  TIMEOUT_ERROR: 'error_timeout_error',

  // Biometric errors
  BIOMETRIC_ENROLLMENT_FAILED: 'error_biometric_enrollment_failed',
  BIOMETRIC_AUTH_ERROR: 'error_biometric_auth_error',

  // Member errors
  INVITE_FAILED: 'error_invite_failed',
  CHECK_IN_FAILED: 'error_check_in_failed',

  // Payment errors
  PAYMENT_FAILED: 'error_payment_failed',
  SUBSCRIPTION_FAILED: 'error_subscription_failed',

  // General errors
  FORM_VALIDATION_ERROR: 'error_form_validation',
  STORAGE_ERROR: 'error_storage',
  UNKNOWN_ERROR: 'error_unknown',
} as const;

/**
 * Performance events
 */
export const PerformanceEvents = {
  APP_LAUNCH: 'performance_app_launch',
  SCREEN_LOAD_TIME: 'performance_screen_load_time',
  API_RESPONSE_TIME: 'performance_api_response_time',
  SLOW_RENDER: 'performance_slow_render',
} as const;

/**
 * Engagement events
 */
export const EngagementEvents = {
  APP_OPENED: 'engagement_app_opened',
  APP_BACKGROUNDED: 'engagement_app_backgrounded',
  APP_CLOSED: 'engagement_app_closed',
  SESSION_STARTED: 'engagement_session_started',
  SESSION_ENDED: 'engagement_session_ended',
  FEATURE_DISCOVERED: 'engagement_feature_discovered',
} as const;

/**
 * All analytics events
 */
export const AnalyticsEvents = {
  ...ScreenEvents,
  ...UserActionEvents,
  ...ErrorEvents,
  ...PerformanceEvents,
  ...EngagementEvents,
} as const;

/**
 * Event parameter types
 */
export interface EventParameters {
  // Common parameters
  user_id?: string;
  timestamp?: number;
  screen_name?: string;
  previous_screen?: string;

  // Error parameters
  error_message?: string;
  error_code?: string;
  error_stack?: string;

  // Performance parameters
  duration_ms?: number;
  load_time_ms?: number;

  // User action parameters
  action_source?: string;
  item_id?: string;
  item_type?: string;

  // Custom parameters
  [key: string]: string | number | boolean | undefined;
}

/**
 * Type for all event names
 */
export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
