/**
 * Push notification service using Firebase Cloud Messaging
 */

import { ApiError, ErrorCodes } from './errors.ts';
import { getSupabaseClient } from './db.ts';

// Firebase server key (from Firebase Console)
const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY') || '';
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<void> {
  if (!FIREBASE_SERVER_KEY) {
    console.error('Firebase server key not configured');
    return; // Don't throw - push notifications are not critical
  }

  try {
    // Get user's FCM tokens
    const tokens = await getUserFcmTokens(userId);

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    // Send to all tokens
    const promises = tokens.map(token => sendToToken(token, notification));
    await Promise.all(promises);

    // Log notification
    await logNotification(userId, notification.title, notification.body);
  } catch (error) {
    console.error('Failed to send push notification:', error);
    // Don't throw - push notifications are not critical
  }
}

/**
 * Send notification to a specific FCM token
 */
async function sendToToken(
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<void> {
  try {
    const payload = {
      to: token,
      notification: {
        title: notification.title,
        body: notification.body,
        sound: 'default',
        badge: 1,
      },
      data: notification.data || {},
      priority: 'high',
    };

    const response = await fetch(FCM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('FCM API error:', result);

      // Handle invalid/expired tokens
      if (result.results?.[0]?.error === 'InvalidRegistration' ||
          result.results?.[0]?.error === 'NotRegistered') {
        await deactivateFcmToken(token);
      }
    }
  } catch (error) {
    console.error('Failed to send to token:', error);
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<void> {
  const promises = userIds.map(userId =>
    sendPushNotification(userId, notification)
  );

  await Promise.all(promises);
}

/**
 * Get user's FCM tokens
 */
async function getUserFcmTokens(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('push_notification_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('Failed to fetch FCM tokens:', error);
    return [];
  }

  return (data || []).map(row => row.token);
}

/**
 * Register FCM token for user
 */
export async function registerFcmToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  const supabase = getSupabaseClient();

  // Check if token already exists
  const { data: existing } = await supabase
    .from('push_notification_tokens')
    .select('id')
    .eq('token', token)
    .single();

  if (existing) {
    // Update existing token
    await supabase
      .from('push_notification_tokens')
      .update({
        user_id: userId,
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('token', token);
  } else {
    // Create new token
    await supabase
      .from('push_notification_tokens')
      .insert({
        user_id: userId,
        token,
        platform,
        active: true,
      });
  }
}

/**
 * Deactivate FCM token (when it's invalid/expired)
 */
async function deactivateFcmToken(token: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('push_notification_tokens')
    .update({ active: false })
    .eq('token', token);
}

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  const supabase = getSupabaseClient();

  try {
    await supabase.from('app_notifications').insert({
      user_id: userId,
      title,
      body,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log notification:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Notification helper functions for specific events
 */

export async function sendMissedCheckInNotification(
  contactUserId: string,
  memberName: string
): Promise<void> {
  await sendPushNotification(contactUserId, {
    title: 'Missed Check-in Alert',
    body: `${memberName} has not checked in today. Please reach out to ensure they're okay.`,
    data: {
      type: 'missed_check_in',
      member_name: memberName,
    },
  });
}

export async function sendLateCheckInNotification(
  contactUserId: string,
  memberName: string,
  minutesLate: number
): Promise<void> {
  await sendPushNotification(contactUserId, {
    title: 'Late Check-in',
    body: `${memberName} checked in ${minutesLate} minutes late today.`,
    data: {
      type: 'late_check_in',
      member_name: memberName,
      minutes_late: minutesLate.toString(),
    },
  });
}

export async function sendCheckInTimeChangedNotification(
  contactUserId: string,
  memberName: string,
  newTime: string
): Promise<void> {
  await sendPushNotification(contactUserId, {
    title: 'Check-in Time Changed',
    body: `${memberName} changed their check-in time to ${newTime}.`,
    data: {
      type: 'check_in_time_changed',
      member_name: memberName,
      new_time: newTime,
    },
  });
}

export async function sendRelationshipAddedNotification(
  userId: string,
  otherPersonName: string,
  isMember: boolean
): Promise<void> {
  const message = isMember
    ? `${otherPersonName} is now monitoring your check-ins.`
    : `You are now monitoring ${otherPersonName}'s check-ins.`;

  await sendPushNotification(userId, {
    title: 'New Connection',
    body: message,
    data: {
      type: 'relationship_added',
      other_person_name: otherPersonName,
    },
  });
}

export async function sendRelationshipRemovedNotification(
  userId: string,
  otherPersonName: string,
  isMember: boolean
): Promise<void> {
  const message = isMember
    ? `${otherPersonName} is no longer monitoring your check-ins.`
    : `You are no longer monitoring ${otherPersonName}'s check-ins.`;

  await sendPushNotification(userId, {
    title: 'Connection Removed',
    body: message,
    data: {
      type: 'relationship_removed',
      other_person_name: otherPersonName,
    },
  });
}

export async function sendTrialExpiringNotification(
  userId: string,
  daysRemaining: number
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Trial Ending Soon',
    body: `Your trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. Add a payment method to continue.`,
    data: {
      type: 'trial_expiring',
      days_remaining: daysRemaining.toString(),
    },
  });
}

export async function sendPaymentFailedNotification(
  userId: string,
  daysUntilFreeze: number
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Payment Failed',
    body: `Your payment failed. Please update your payment method within ${daysUntilFreeze} ${daysUntilFreeze === 1 ? 'day' : 'days'}.`,
    data: {
      type: 'payment_failed',
      days_until_freeze: daysUntilFreeze.toString(),
    },
  });
}

export async function sendPaymentSuccessNotification(
  userId: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Payment Successful',
    body: 'Your payment was successful. Thank you!',
    data: {
      type: 'payment_success',
    },
  });
}

export async function sendSubscriptionCanceledNotification(
  userId: string,
  endDate: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Subscription Canceled',
    body: `Your subscription has been canceled. You'll have access until ${endDate}.`,
    data: {
      type: 'subscription_canceled',
      end_date: endDate,
    },
  });
}

export async function sendWelcomeNotification(
  userId: string,
  name: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Welcome to Pruuf!',
    body: `Welcome ${name}! Check in daily to keep your loved ones informed.`,
    data: {
      type: 'welcome',
    },
  });
}
