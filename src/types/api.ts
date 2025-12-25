/**
 * Pruuf API Response Types
 */

import {User, Member, CheckIn, MemberContactRelationship} from './database';

// Generic API response
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth responses
export interface VerificationCodeResponse {
  success: boolean;
  message: string;
  code_expires_at?: string;
  error?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  session_token?: string;
  expires_at?: string;
  error?: string;
  message?: string;
  attempts_remaining?: number;
  /** Whether the user already has an account (for login flow differentiation) */
  user_exists?: boolean;
  /** Whether the user needs to create an account (inverse of user_exists) */
  requires_account_creation?: boolean;
  /** Seconds until session token expires */
  expires_in?: number;
}

export interface CreateAccountResponse {
  success: boolean;
  user?: UserProfile;
  access_token?: string;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: UserProfile;
  access_token?: string;
  error?: string;
  message?: string;
  attempts_remaining?: number;
  locked_until?: string;
}

// User profile (returned to client, excludes sensitive data)
export interface UserProfile {
  id: string;
  email: string;
  account_status: string;
  is_member: boolean;
  grandfathered_free: boolean;
  font_size_preference: string;
  trial_end_date: string | null;
}

// Member responses
export interface InviteMemberResponse {
  success: boolean;
  member?: MemberInfo;
  message?: string;
  error?: string;
}

export interface MemberInfo {
  id: string;
  name: string;
  email: string;
  email_masked: string;
  status: string;
  invite_code?: string;
  check_in_time?: string;
  timezone?: string;
  formatted_time?: string;
  last_check_in?: LastCheckIn;
  invited_at?: string;
  connected_at?: string;
}

export interface LastCheckIn {
  checked_in_at: string;
  local_time: string;
  minutes_early?: number;
  minutes_late?: number;
}

export interface CheckInResponse {
  success: boolean;
  check_in?: {
    id: string;
    checked_in_at: string;
    timezone: string;
    local_time: string;
  };
  status: 'on_time' | 'late';
  minutes_late?: number;
  message: string;
  notifications_sent: number;
}

export interface ContactInfo {
  id: string;
  name?: string;
  email: string;
  email_masked: string;
  status: string;
  connected_at?: string;
  invited_at?: string;
}

export interface GetContactsResponse {
  success: boolean;
  contacts: ContactInfo[];
  total_active: number;
  total_pending: number;
}

export interface GetMembersResponse {
  success: boolean;
  members: MemberInfo[];
  total_active: number;
  total_pending: number;
  account_status: string;
}

// Subscription responses
export interface CreateSubscriptionResponse {
  success: boolean;
  subscription?: {
    id: string;
    status: string;
    current_period_end: string;
    price: string;
  };
  message?: string;
  account_status?: string;
  error?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  message?: string;
  access_until?: string;
}
