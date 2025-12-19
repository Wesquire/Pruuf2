/**
 * Pruuf Database Types
 * Matches Supabase PostgreSQL schema
 */

export type AccountStatus =
  | 'trial'
  | 'active'
  | 'active_free'
  | 'frozen'
  | 'past_due'
  | 'canceled'
  | 'deleted'
  | 'expired';

export type FontSizePreference = 'standard' | 'large' | 'extra_large';

export type RelationshipStatus = 'pending' | 'active' | 'removed';

export type SMSType =
  | 'verification'
  | 'member_invite'
  | 'check_in_confirmation'
  | 'missed_check_in'
  | 'late_check_in_update'
  | 'check_in_time_changed'
  | 'contact_removed';

export type NotificationType =
  | 'trial_reminder'
  | 'payment_failed'
  | 'grandfathered_free'
  | 'member_connected'
  | 'invite_monthly_nudge'
  | 'trial_ended'
  | 'subscription_canceled'
  | 'account_frozen';

// Database table types
export interface User {
  id: string;
  phone: string;
  pin_hash: string;
  account_status: AccountStatus;
  is_member: boolean;
  grandfathered_free: boolean;
  font_size_preference: FontSizePreference;
  trial_start_date: string | null;
  trial_end_date: string | null;
  revenuecat_customer_id: string | null;
  revenuecat_subscription_id: string | null;
  last_payment_date: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

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

export interface CheckIn {
  id: string;
  member_id: string;
  checked_in_at: string;
  timezone: string | null;
  created_at: string;
}

export interface MissedCheckInAlert {
  id: string;
  member_id: string;
  alert_type: string;
  sent_at: string;
  created_at: string;
}

export interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  used: boolean;
  attempts: number;
  created_at: string;
}

export interface SMSLog {
  id: string;
  to_phone: string;
  from_phone: string;
  body: string;
  type: SMSType;
  status: string;
  twilio_sid: string | null;
  error_message: string | null;
  sent_at: string;
  delivered_at: string | null;
  created_at: string;
}

export interface PushNotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  action_url: string | null;
  created_at: string;
  read_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
