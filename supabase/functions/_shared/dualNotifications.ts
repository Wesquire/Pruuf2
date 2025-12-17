/**
 * Dual Notification Service (Backend)
 *
 * Implements dual notification strategy: Push + Email for redundancy
 * Automatically routes notifications based on priority level
 *
 * NOTIFICATION PRIORITIES:
 * - CRITICAL: Always send both Push AND Email (missed check-ins, payment failures)
 * - HIGH: Send Push first, Email fallback if push fails
 * - NORMAL: Push only
 * - LOW: Push only (batchable)
 *
 * See docs/NOTIFICATION_STRATEGY.md for complete documentation
 */

import { getSupabaseClient } from './db.ts';
import { sendPushNotification } from './push.ts';
import { sendEmail } from './email.ts';

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Notification types mapped to priorities
 */
export enum NotificationType {
  // Critical (always Push + Email)
  MISSED_CHECK_IN = 'missed_check_in',
  PAYMENT_FAILED = 'payment_failed',
  ACCOUNT_FROZEN = 'account_frozen',

  // High (Push + Email fallback)
  CHECK_IN_CONFIRMATION = 'check_in_confirmation',
  LATE_CHECK_IN = 'late_check_in',
  MEMBER_CONNECTED = 'member_connected',

  // Normal (Push only)
  CHECK_IN_REMINDER = 'check_in_reminder',
  CHECK_IN_TIME_CHANGED = 'check_in_time_changed',
  TRIAL_REMINDER = 'trial_reminder',
  INVITATION_SENT = 'invitation_sent',

  // Low (Push only, batchable)
  WEEKLY_SUMMARY = 'weekly_summary',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
}

/**
 * Notification payload structure
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  userId: string;
  userEmail?: string;
  data?: Record<string, string>;
  actionUrl?: string; // Deep link for email actions
}

/**
 * Notification result tracking
 */
export interface NotificationResult {
  success: boolean;
  pushSent: boolean;
  emailSent: boolean;
  error?: string;
}

/**
 * Get notification priority for a notification type
 */
export function getNotificationPriority(type: NotificationType): NotificationPriority {
  switch (type) {
    // Critical notifications
    case NotificationType.MISSED_CHECK_IN:
    case NotificationType.PAYMENT_FAILED:
    case NotificationType.ACCOUNT_FROZEN:
      return NotificationPriority.CRITICAL;

    // High priority notifications
    case NotificationType.CHECK_IN_CONFIRMATION:
    case NotificationType.LATE_CHECK_IN:
    case NotificationType.MEMBER_CONNECTED:
      return NotificationPriority.HIGH;

    // Low priority notifications
    case NotificationType.WEEKLY_SUMMARY:
    case NotificationType.FEATURE_ANNOUNCEMENT:
      return NotificationPriority.LOW;

    // Normal priority (default)
    default:
      return NotificationPriority.NORMAL;
  }
}

/**
 * Check user notification preferences
 */
async function getUserPreferences(userId: string): Promise<{
  pushEnabled: boolean;
  emailEnabled: boolean;
}> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('users')
    .select('push_notifications_enabled, email_notifications_enabled')
    .eq('id', userId)
    .single();

  if (error || !data) {
    // Default to enabled if can't fetch preferences
    return { pushEnabled: true, emailEnabled: true };
  }

  return {
    pushEnabled: data.push_notifications_enabled ?? true,
    emailEnabled: data.email_notifications_enabled ?? true,
  };
}

/**
 * Main dual notification function
 * Routes notification based on priority and user preferences
 */
export async function sendDualNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const result: NotificationResult = {
    success: false,
    pushSent: false,
    emailSent: false,
  };

  try {
    const priority = getNotificationPriority(payload.type);
    const preferences = await getUserPreferences(payload.userId);

    // Critical notifications ALWAYS send both (override user preferences for safety)
    if (priority === NotificationPriority.CRITICAL) {
      // Send push notification
      try {
        await sendPushNotification(payload.userId, {
          title: payload.title,
          body: payload.body,
          data: { ...payload.data, type: payload.type },
        });
        result.pushSent = true;
      } catch (pushError) {
        console.error('Critical push notification failed:', pushError);
        // Continue - we still have email fallback
      }

      // Send email notification (always for critical)
      if (payload.userEmail) {
        try {
          await sendEmailNotificationWithTemplate(payload);
          result.emailSent = true;
        } catch (emailError) {
          console.error('Critical email notification failed:', emailError);
        }
      }

      // Success if at least one channel worked
      result.success = result.pushSent || result.emailSent;

      // Log critical notification
      await logNotificationAttempt(payload, result, priority);

      return result;
    }

    // High priority: Try push first, email fallback if push fails
    if (priority === NotificationPriority.HIGH) {
      // Respect push preference
      if (preferences.pushEnabled) {
        try {
          await sendPushNotification(payload.userId, {
            title: payload.title,
            body: payload.body,
            data: { ...payload.data, type: payload.type },
          });
          result.pushSent = true;
          result.success = true;
        } catch (pushError) {
          console.error('High priority push notification failed:', pushError);
          // Push failed - try email fallback
          if (payload.userEmail && preferences.emailEnabled) {
            try {
              await sendEmailNotificationWithTemplate(payload);
              result.emailSent = true;
              result.success = true;
            } catch (emailError) {
              console.error('High priority email fallback failed:', emailError);
            }
          }
        }
      } else if (payload.userEmail && preferences.emailEnabled) {
        // Push disabled - send email instead
        try {
          await sendEmailNotificationWithTemplate(payload);
          result.emailSent = true;
          result.success = true;
        } catch (emailError) {
          console.error('High priority email notification failed:', emailError);
        }
      }

      await logNotificationAttempt(payload, result, priority);
      return result;
    }

    // Normal/Low priority: Push only (respect user preferences)
    if (preferences.pushEnabled) {
      try {
        await sendPushNotification(payload.userId, {
          title: payload.title,
          body: payload.body,
          data: { ...payload.data, type: payload.type },
        });
        result.pushSent = true;
        result.success = true;
      } catch (pushError) {
        console.error('Push notification failed:', pushError);
      }
    }

    await logNotificationAttempt(payload, result, priority);
    return result;

  } catch (error) {
    console.error('Dual notification error:', error);
    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

/**
 * Send email notification using template
 */
async function sendEmailNotificationWithTemplate(
  payload: NotificationPayload
): Promise<void> {
  if (!payload.userEmail) {
    throw new Error('User email not provided for email notification');
  }

  // Build HTML email body
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #4CAF50; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Pruuf</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #212121; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">${payload.title}</h2>
      <div style="color: #424242; font-size: 16px; line-height: 1.6;">
        ${payload.body.split('\n').map(line => `<p style="margin: 0 0 16px 0;">${line}</p>`).join('')}
      </div>

      ${payload.actionUrl ? `
      <div style="margin: 30px 0;">
        <a href="${payload.actionUrl}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-size: 16px; font-weight: 600;">Open Pruuf</a>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="padding: 30px; background-color: #f5f5f5; text-align: center;">
      <p style="color: #757575; font-size: 14px; margin: 0;">
        You're receiving this email because you're using Pruuf.
      </p>
      <p style="color: #757575; font-size: 14px; margin: 10px 0 0 0;">
        <a href="https://pruuf.me/settings/notifications" style="color: #4CAF50; text-decoration: none;">Notification Settings</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Plain text version
  const textBody = `
${payload.title}

${payload.body}

${payload.actionUrl ? `\nOpen Pruuf: ${payload.actionUrl}` : ''}

---
You're receiving this email because you're using Pruuf.
Manage notification settings: https://pruuf.me/settings/notifications
  `.trim();

  // Send via Postmark (using shared email service)
  await sendEmail(
    payload.userEmail,
    payload.title,
    htmlBody,
    textBody,
    payload.type
  );
}

/**
 * Log notification attempt to database
 */
async function logNotificationAttempt(
  payload: NotificationPayload,
  result: NotificationResult,
  priority: NotificationPriority
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    // Log to push_notification_logs if push was attempted
    if (result.pushSent || priority === NotificationPriority.CRITICAL) {
      await supabase.from('push_notification_logs').insert({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        priority: priority,
        sent_count: result.pushSent ? 1 : 0,
        failed_count: result.pushSent ? 0 : 1,
      });
    }

    // Log to email_notification_logs if email was attempted
    if (result.emailSent && payload.userEmail) {
      await supabase.from('email_notification_logs').insert({
        user_email: payload.userEmail,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data || {},
      });
    }
  } catch (logError) {
    console.error('Failed to log notification attempt:', logError);
    // Don't throw - logging failure shouldn't break notifications
  }
}

/**
 * Helper functions for specific notification types
 */

export async function sendMissedCheckInAlert(
  contactUserId: string,
  contactEmail: string,
  memberName: string,
  memberPhone: string
): Promise<NotificationResult> {
  return sendDualNotification({
    type: NotificationType.MISSED_CHECK_IN,
    title: 'Missed Check-in Alert',
    body: `${memberName} has not checked in today.\n\nPlease reach out to ensure they're okay.\n\nCall ${memberName}: ${memberPhone}`,
    userId: contactUserId,
    userEmail: contactEmail,
    data: {
      member_name: memberName,
      member_phone: memberPhone,
    },
    actionUrl: 'pruuf://members',
  });
}

export async function sendCheckInConfirmation(
  contactUserId: string,
  contactEmail: string,
  memberName: string,
  checkInTime: string
): Promise<NotificationResult> {
  return sendDualNotification({
    type: NotificationType.CHECK_IN_CONFIRMATION,
    title: `${memberName} Checked In`,
    body: `${memberName} checked in at ${checkInTime}. All is well!`,
    userId: contactUserId,
    userEmail: contactEmail,
    data: {
      member_name: memberName,
      check_in_time: checkInTime,
    },
  });
}

export async function sendLateCheckInAlert(
  contactUserId: string,
  contactEmail: string,
  memberName: string,
  minutesLate: number,
  checkInTime: string
): Promise<NotificationResult> {
  return sendDualNotification({
    type: NotificationType.LATE_CHECK_IN,
    title: `${memberName} Checked In Late`,
    body: `${memberName} checked in ${minutesLate} minutes late at ${checkInTime}.`,
    userId: contactUserId,
    userEmail: contactEmail,
    data: {
      member_name: memberName,
      minutes_late: minutesLate.toString(),
      check_in_time: checkInTime,
    },
  });
}

export async function sendPaymentFailedAlert(
  userId: string,
  userEmail: string,
  daysUntilFreeze: number
): Promise<NotificationResult> {
  return sendDualNotification({
    type: NotificationType.PAYMENT_FAILED,
    title: 'Payment Failed',
    body: `Your payment failed. Please update your payment method within ${daysUntilFreeze} ${daysUntilFreeze === 1 ? 'day' : 'days'} to continue receiving alerts.`,
    userId,
    userEmail,
    data: {
      days_until_freeze: daysUntilFreeze.toString(),
    },
    actionUrl: 'pruuf://settings/payment',
  });
}

export async function sendAccountFrozenAlert(
  userId: string,
  userEmail: string
): Promise<NotificationResult> {
  return sendDualNotification({
    type: NotificationType.ACCOUNT_FROZEN,
    title: 'Account Frozen',
    body: 'Your account has been frozen due to payment failure. Update your payment method to reactivate your account and resume receiving alerts.',
    userId,
    userEmail,
    data: {},
    actionUrl: 'pruuf://settings/payment',
  });
}

export async function sendMemberConnectedNotification(
  contactUserId: string,
  contactEmail: string,
  memberName: string
): Promise<NotificationResult> {
  return sendDualNotification({
    type: NotificationType.MEMBER_CONNECTED,
    title: 'New Member Connected',
    body: `${memberName} accepted your invitation and is now connected! You'll receive daily check-in confirmations and alerts.`,
    userId: contactUserId,
    userEmail: contactEmail,
    data: {
      member_name: memberName,
    },
    actionUrl: 'pruuf://members',
  });
}

export async function sendCheckInReminderNotification(
  memberId: string,
  checkInTime: string
): Promise<NotificationResult> {
  // Note: Reminders are push-only (NORMAL priority), no email needed
  return sendDualNotification({
    type: NotificationType.CHECK_IN_REMINDER,
    title: 'Time to Check In',
    body: `Your check-in time (${checkInTime}) is coming up. Don't forget to tap "I'm OK"!`,
    userId: memberId,
    data: {
      check_in_time: checkInTime,
    },
  });
}

export async function sendTrialReminderNotification(
  userId: string,
  userEmail: string,
  daysRemaining: number
): Promise<NotificationResult> {
  const title = daysRemaining === 1
    ? 'Trial Ends Tomorrow'
    : `${daysRemaining} Days Left in Trial`;

  const body = daysRemaining === 1
    ? 'Your trial ends tomorrow. Add a payment method to continue monitoring your loved ones.'
    : `Your free trial ends in ${daysRemaining} days. Add a payment method to avoid interruption.`;

  return sendDualNotification({
    type: NotificationType.TRIAL_REMINDER,
    title,
    body,
    userId,
    userEmail,
    data: {
      days_remaining: daysRemaining.toString(),
    },
    actionUrl: 'pruuf://settings/payment',
  });
}

/**
 * Batch notification support (for low-priority notifications)
 */
export async function sendBatchNotifications(
  payloads: NotificationPayload[]
): Promise<NotificationResult[]> {
  const results = await Promise.all(
    payloads.map(payload => sendDualNotification(payload))
  );

  return results;
}
