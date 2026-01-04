/**
 * Pruuf Database Types
 * Matches Supabase PostgreSQL schema
 */

export type AccountStatus = 'active' | 'deleted';

export type FontSizePreference = 'standard' | 'large' | 'extra_large';

export type RelationshipStatus = 'pending' | 'active' | 'removed';

export type EmailType =
  | 'verification'
  | 'member_invite'
  | 'check_in_confirmation'
  | 'missed_check_in'
  | 'late_check_in_update'
  | 'check_in_time_changed'
  | 'contact_removed';

export type NotificationType =
  | 'member_connected'
  | 'invite_monthly_nudge';

// Database table types
export interface User {
  id: string;
  email: string;
  pin_hash: string;
  account_status: AccountStatus;
  is_member: boolean;
  font_size_preference: FontSizePreference;
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
  email: string;
  code: string;
  expires_at: string;
  used: boolean;
  attempts: number;
  created_at: string;
}

export interface EmailLog {
  id: string;
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  type: EmailType;
  status: string;
  postmark_message_id: string | null;
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
