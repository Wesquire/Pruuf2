/**
 * Shared TypeScript types for Supabase Edge Functions
 */

// User account statuses
export type AccountStatus =
  | 'trial'
  | 'active'
  | 'active_free'
  | 'frozen'
  | 'past_due'
  | 'canceled'
  | 'deleted';

// Relationship statuses
export type RelationshipStatus = 'pending' | 'active' | 'removed';

// Font size preferences
export type FontSizePreference = 'standard' | 'large' | 'extra_large';

// User from database
export interface User {
  id: string;
  email: string;
  phone: string | null;
  pin_hash: string;
  account_status: AccountStatus;
  is_member: boolean;
  grandfathered_free: boolean;
  font_size_preference: FontSizePreference;
  trial_start_date: string | null;
  trial_end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  last_payment_date: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Member from database
export interface Member {
  id: string;
  user_id: string;
  name: string;
  check_in_time: string | null;
  timezone: string | null;
  reminder_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Member-Contact relationship from database
export interface MemberContactRelationship {
  id: string;
  member_id: string;
  contact_id: string;
  invite_code: string;
  status: RelationshipStatus;
  invited_at: string;
  connected_at: string | null;
  last_invite_sent_at: string;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Check-in from database
export interface CheckIn {
  id: string;
  member_id: string;
  checked_in_at: string;
  timezone: string | null;
  created_at: string;
}

// Verification code from database
export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  used: boolean;
  attempts: number;
  created_at: string;
}

// Push notification token from database
export interface PushNotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  active: boolean;
  created_at: string;
  updated_at: string;
}

// JWT Payload
export interface JwtPayload {
  user_id: string;
  email: string;
  iat: number;
  exp: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'ApiError';
  }
}

// Request context (added by middleware)
export interface RequestContext {
  user?: User;
  userId?: string;
  token?: string;
}
