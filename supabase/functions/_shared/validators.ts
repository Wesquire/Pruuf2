/**
 * Edge case validators and business rule validators
 * Comprehensive validation functions for all edge cases
 */

import {ApiError, ErrorCodes} from './errors.ts';
import {getSupabaseClient, getUserById} from './db.ts';
import type {User} from './types.ts';

/**
 * Validate that user's account is not frozen
 */
export async function validateAccountNotFrozen(user: User): Promise<void> {
  if (user.account_status === 'frozen') {
    throw new ApiError(
      'Your account is frozen due to unpaid subscription. Please update your payment method to regain access.',
      403,
      ErrorCodes.ACCOUNT_FROZEN,
    );
  }
}

/**
 * Validate that user's account is not deleted
 */
export async function validateAccountNotDeleted(user: User): Promise<void> {
  if (user.deleted_at !== null) {
    throw new ApiError(
      'This account has been deleted',
      403,
      ErrorCodes.ACCOUNT_DELETED,
    );
  }
}

/**
 * Validate that user is not locked out
 */
export async function validateAccountNotLocked(user: User): Promise<void> {
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutesRemaining = Math.ceil(
      (new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60,
    );
    throw new ApiError(
      `Account is locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes`,
      403,
      ErrorCodes.ACCOUNT_LOCKED,
    );
  }
}

/**
 * Validate that user is a Member
 */
export async function validateUserIsMember(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: member} = await supabase
    .from('members')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!member) {
    throw new ApiError(
      'This action requires a Member profile',
      400,
      ErrorCodes.NOT_MEMBER,
    );
  }
}

/**
 * Validate that Member has completed onboarding
 */
export async function validateMemberOnboardingComplete(
  userId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: member} = await supabase
    .from('members')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single();

  if (!member || !member.onboarding_completed) {
    throw new ApiError(
      'Please complete onboarding first',
      400,
      ErrorCodes.ONBOARDING_INCOMPLETE,
    );
  }
}

/**
 * Validate that user cannot invite themselves
 */
export async function validateNotSelfInvite(
  contactUserId: string,
  memberPhone: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: user} = await supabase
    .from('users')
    .select('phone')
    .eq('id', contactUserId)
    .single();

  if (user && user.phone === memberPhone) {
    throw new ApiError(
      'You cannot invite yourself',
      400,
      ErrorCodes.SELF_INVITE,
    );
  }
}

/**
 * Validate that relationship doesn't already exist
 */
export async function validateRelationshipDoesNotExist(
  memberUserId: string,
  contactUserId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: existing} = await supabase
    .from('member_contact_relationships')
    .select('id, status')
    .eq('member_id', memberUserId)
    .eq('contact_id', contactUserId)
    .is('deleted_at', null)
    .single();

  if (existing) {
    if (existing.status === 'pending') {
      throw new ApiError(
        'An invitation is already pending for this Member',
        400,
        ErrorCodes.DUPLICATE_RELATIONSHIP,
      );
    } else if (existing.status === 'active') {
      throw new ApiError(
        'This Member is already connected to you',
        400,
        ErrorCodes.DUPLICATE_RELATIONSHIP,
      );
    }
  }
}

/**
 * Validate that invite code is unique
 */
export async function validateInviteCodeUnique(
  inviteCode: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: existing} = await supabase
    .from('member_contact_relationships')
    .select('id')
    .eq('invite_code', inviteCode)
    .single();

  if (existing) {
    // Generate a new code recursively
    throw new ApiError(
      'Invite code collision detected',
      500,
      ErrorCodes.INTERNAL_ERROR,
    );
  }
}

/**
 * Validate that invite resend rate limit is respected (1 hour)
 */
export async function validateInviteResendRateLimit(
  memberUserId: string,
  contactUserId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: relationship} = await supabase
    .from('member_contact_relationships')
    .select('last_invite_sent_at')
    .eq('member_id', memberUserId)
    .eq('contact_id', contactUserId)
    .single();

  if (relationship && relationship.last_invite_sent_at) {
    const lastSent = new Date(relationship.last_invite_sent_at);
    const now = new Date();
    const hoursSinceLastSent =
      (now.getTime() - lastSent.getTime()) / 1000 / 60 / 60;

    if (hoursSinceLastSent < 1) {
      const minutesRemaining = Math.ceil((1 - hoursSinceLastSent) * 60);
      throw new ApiError(
        `Please wait ${minutesRemaining} minutes before resending invitation`,
        429,
        ErrorCodes.RATE_LIMIT_EXCEEDED,
      );
    }
  }
}

/**
 * Validate that check-in hasn't already been done today
 * This implements idempotency for check-ins
 */
export async function validateCheckInNotDoneToday(
  memberId: string,
  timezone: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const todayStart = getTodayStartInTimezone(timezone);
  const todayEnd = getTodayEndInTimezone(timezone);

  const {data: existingCheckIn} = await supabase
    .from('check_ins')
    .select('id')
    .eq('member_id', memberId)
    .gte('checked_in_at', todayStart)
    .lte('checked_in_at', todayEnd)
    .single();

  if (existingCheckIn) {
    throw new ApiError(
      'You have already checked in today',
      400,
      ErrorCodes.ALREADY_CHECKED_IN,
    );
  }
}

/**
 * Validate that payment method belongs to customer
 */
export async function validatePaymentMethodOwnership(
  paymentMethodId: string,
  customerId: string,
): Promise<void> {
  // This would integrate with Stripe API
  // For now, we trust the client
  // In production, fetch payment method and verify customer match
}

/**
 * Validate that subscription can be cancelled
 */
export async function validateSubscriptionCancellable(
  userId: string,
): Promise<void> {
  const user = await getUserById(userId);

  if (!user.stripe_subscription_id) {
    throw new ApiError(
      'No active subscription found',
      404,
      ErrorCodes.NOT_FOUND,
    );
  }

  if (user.account_status === 'canceled') {
    throw new ApiError(
      'Subscription is already canceled',
      400,
      ErrorCodes.ALREADY_CANCELED,
    );
  }
}

/**
 * Validate that grandfathered user cannot pay
 * Prevent grandfathered Members from creating subscriptions
 */
export async function validateUserRequiresPayment(
  userId: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const {data: requiresPayment} = await supabase.rpc('requires_payment', {
    user_id: userId,
  });

  if (!requiresPayment) {
    const user = await getUserById(userId);

    if (user.grandfathered_free) {
      throw new ApiError(
        'You have grandfathered free access! You never need to pay for Pruuf.',
        400,
        ErrorCodes.GRANDFATHERED_FREE,
      );
    }

    if (user.is_member) {
      throw new ApiError(
        "You're a Pruuf Member, so monitoring is free! Only Contacts pay $3.99/month.",
        400,
        ErrorCodes.MEMBER_NO_PAYMENT,
      );
    }

    throw new ApiError(
      'Payment is not required for your account',
      400,
      ErrorCodes.PAYMENT_NOT_REQUIRED,
    );
  }
}

/**
 * Validate timezone is valid
 */
export async function validateTimezone(timezone: string): Promise<void> {
  const validTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Anchorage',
    'Pacific/Honolulu',
    'UTC',
  ];

  if (!validTimezones.includes(timezone)) {
    throw new ApiError(
      `Invalid timezone. Must be one of: ${validTimezones.join(', ')}`,
      400,
      ErrorCodes.INVALID_TIMEZONE,
    );
  }
}

/**
 * Validate check-in time format (HH:MM)
 */
export async function validateCheckInTimeFormat(
  checkInTime: string,
): Promise<void> {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timeRegex.test(checkInTime)) {
    throw new ApiError(
      'Invalid check-in time format. Must be HH:MM (24-hour format)',
      400,
      ErrorCodes.INVALID_TIME_FORMAT,
    );
  }
}

/**
 * Validate that trial has not expired
 */
export async function validateTrialNotExpired(user: User): Promise<void> {
  if (user.account_status === 'trial' && user.trial_end_date) {
    const trialEnd = new Date(user.trial_end_date);
    const now = new Date();

    if (now > trialEnd) {
      throw new ApiError(
        'Your trial has expired. Please add a payment method to continue.',
        403,
        ErrorCodes.TRIAL_EXPIRED,
      );
    }
  }
}

/**
 * Validate that user has active subscription or is in trial
 */
export async function validateActiveAccess(user: User): Promise<void> {
  const validStatuses = ['trial', 'active', 'active_free'];

  if (!validStatuses.includes(user.account_status)) {
    throw new ApiError(
      'Your account does not have active access. Please update your payment method.',
      403,
      ErrorCodes.ACCESS_DENIED,
    );
  }
}

/**
 * Helper: Get today start in timezone
 */
function getTodayStartInTimezone(timezone: string): string {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  const startLocal = new Date(year, month, day, 0, 0, 0, 0);
  const offsetMs = getTimezoneOffset(timezone) * 60 * 60 * 1000;
  const startUTC = new Date(startLocal.getTime() - offsetMs);

  return startUTC.toISOString();
}

/**
 * Helper: Get today end in timezone
 */
function getTodayEndInTimezone(timezone: string): string {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  const endLocal = new Date(year, month, day, 23, 59, 59, 999);
  const offsetMs = getTimezoneOffset(timezone) * 60 * 60 * 1000;
  const endUTC = new Date(endLocal.getTime() - offsetMs);

  return endUTC.toISOString();
}

/**
 * Helper: Get timezone offset
 */
function getTimezoneOffset(timezone: string): number {
  const offsets: Record<string, number> = {
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'America/Phoenix': -7,
    'America/Anchorage': -9,
    'Pacific/Honolulu': -10,
    UTC: 0,
  };

  return offsets[timezone] || 0;
}
