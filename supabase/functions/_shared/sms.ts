/**
 * Twilio SMS service for Supabase Edge Functions
 */

import {ApiError, ErrorCodes} from './errors.ts';
import {logSms} from './db.ts';

// Twilio credentials
const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID') || '';
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') || '';

/**
 * Send SMS via Twilio
 */
export async function sendSms(
  to: string,
  body: string,
  type: string = 'generic',
): Promise<string> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new ApiError(
      'Twilio credentials not configured',
      500,
      ErrorCodes.SMS_ERROR,
    );
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams({
      To: to,
      From: TWILIO_PHONE_NUMBER,
      Body: body,
    });

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);

      // Log failed SMS
      await logSms(to, TWILIO_PHONE_NUMBER, body, type, 'failed');

      throw new ApiError(
        `Failed to send SMS: ${data.message || 'Unknown error'}`,
        500,
        ErrorCodes.SMS_ERROR,
      );
    }

    // Log successful SMS
    await logSms(to, TWILIO_PHONE_NUMBER, body, type, 'sent', data.sid);

    return data.sid;
  } catch (error) {
    console.error('SMS error:', error);

    // Log failed SMS
    await logSms(to, TWILIO_PHONE_NUMBER, body, type, 'failed');

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Failed to send SMS', 500, ErrorCodes.SMS_ERROR);
  }
}

/**
 * Send verification code SMS
 */
export async function sendVerificationCodeSms(
  phone: string,
  code: string,
): Promise<string> {
  const body = `Your Pruuf verification code is: ${code}. Valid for 10 minutes.`;
  return await sendSms(phone, body, 'verification_code');
}

/**
 * Send member invitation SMS
 */
export async function sendMemberInvitationSms(
  phone: string,
  memberName: string,
  contactName: string,
  inviteCode: string,
): Promise<string> {
  const body = `Hi ${memberName}! ${contactName} has invited you to Pruuf, a daily check-in safety app. Download the app and use invite code: ${inviteCode}`;
  return await sendSms(phone, body, 'member_invitation');
}

/**
 * Send missed check-in alert SMS
 */
export async function sendMissedCheckInSms(
  contactPhone: string,
  memberName: string,
): Promise<string> {
  const body = `Alert: ${memberName} has not checked in today. Please reach out to ensure they're okay.`;
  return await sendSms(contactPhone, body, 'missed_check_in');
}

/**
 * Send late check-in notification SMS
 */
export async function sendLateCheckInSms(
  contactPhone: string,
  memberName: string,
  minutesLate: number,
): Promise<string> {
  const body = `Notice: ${memberName} checked in ${minutesLate} minutes late today.`;
  return await sendSms(contactPhone, body, 'late_check_in');
}

/**
 * Send trial expiration warning SMS
 */
export async function sendTrialExpirationWarningSms(
  phone: string,
  daysRemaining: number,
): Promise<string> {
  const body = `Your Pruuf trial ends in ${daysRemaining} ${
    daysRemaining === 1 ? 'day' : 'days'
  }. Add a payment method to continue monitoring your loved ones.`;
  return await sendSms(phone, body, 'trial_expiration_warning');
}

/**
 * Send trial expired SMS
 */
export async function sendTrialExpiredSms(phone: string): Promise<string> {
  const body =
    'Your Pruuf trial has expired. Add a payment method to continue using the app. Only $4.99/month.';
  return await sendSms(phone, body, 'trial_expired');
}

/**
 * Send payment failure SMS
 */
export async function sendPaymentFailureSms(
  phone: string,
  daysUntilFreeze: number,
): Promise<string> {
  const body = `Your payment for Pruuf failed. Please update your payment method within ${daysUntilFreeze} ${
    daysUntilFreeze === 1 ? 'day' : 'days'
  } to avoid service interruption.`;
  return await sendSms(phone, body, 'payment_failure');
}

/**
 * Send payment success SMS
 */
export async function sendPaymentSuccessSms(phone: string): Promise<string> {
  const body =
    'Your Pruuf payment was successful. Thank you for keeping your loved ones safe!';
  return await sendSms(phone, body, 'payment_success');
}

/**
 * Send account frozen SMS
 */
export async function sendAccountFrozenSms(phone: string): Promise<string> {
  const body =
    'Your Pruuf account has been frozen due to payment failure. Please update your payment method to reactivate your account.';
  return await sendSms(phone, body, 'account_frozen');
}

/**
 * Send welcome SMS (after account creation)
 */
export async function sendWelcomeSms(
  phone: string,
  name: string,
): Promise<string> {
  const body = `Welcome to Pruuf, ${name}! Check in daily and your contacts will be alerted if you miss a check-in. Stay safe!`;
  return await sendSms(phone, body, 'welcome');
}

/**
 * Send forgot PIN verification SMS
 */
export async function sendForgotPinSms(
  phone: string,
  code: string,
): Promise<string> {
  const body = `Your Pruuf PIN reset code is: ${code}. Valid for 10 minutes.`;
  return await sendSms(phone, body, 'forgot_pin');
}

/**
 * Send PIN reset confirmation SMS
 */
export async function sendPinResetConfirmationSms(
  phone: string,
): Promise<string> {
  const body =
    'Your Pruuf PIN has been successfully reset. You can now log in with your new PIN.';
  return await sendSms(phone, body, 'pin_reset_confirmation');
}

/**
 * Send relationship removed notification SMS
 */
export async function sendRelationshipRemovedSms(
  phone: string,
  otherPersonName: string,
  isMember: boolean,
): Promise<string> {
  const body = isMember
    ? `${otherPersonName} is no longer monitoring your check-ins on Pruuf.`
    : `You are no longer monitoring ${otherPersonName}'s check-ins on Pruuf.`;
  return await sendSms(phone, body, 'relationship_removed');
}

/**
 * Send check-in time changed notification SMS
 */
export async function sendCheckInTimeChangedSms(
  contactPhone: string,
  memberName: string,
  newTime: string,
  timezone: string,
): Promise<string> {
  const body = `${memberName} has changed their check-in time to ${newTime} ${timezone}.`;
  return await sendSms(contactPhone, body, 'check_in_time_changed');
}

/**
 * Send subscription canceled SMS
 */
export async function sendSubscriptionCanceledSms(
  phone: string,
  endDate: string,
): Promise<string> {
  const body = `Your Pruuf subscription has been canceled. You'll have access until ${endDate}.`;
  return await sendSms(phone, body, 'subscription_canceled');
}

/**
 * Send subscription reactivated SMS
 */
export async function sendSubscriptionReactivatedSms(
  phone: string,
): Promise<string> {
  const body = 'Your Pruuf subscription has been reactivated. Thank you!';
  return await sendSms(phone, body, 'subscription_reactivated');
}

/**
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+1\d{10}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number to E.164
 */
export function formatPhoneE164(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // If already 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If 10 digits, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }

  return phone;
}

/**
 * Mask phone number for display (show last 4 digits only)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    return `(***) ***-${last4}`;
  }

  return phone;
}
