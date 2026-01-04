/**
 * Push notification service using Expo Push Notification API
 *
 * Expo Push API:
 * - Endpoint: https://exp.host/--/api/v2/push/send
 * - Token format: ExponentPushToken[xxx]
 * - Batch up to 100 notifications per request
 */

import {getSupabaseClient} from './db.ts';

// Expo Push API endpoint
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Expo Push Message format
 */
interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, string>;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
  badge?: number;
}

/**
 * Expo Push Ticket (response from send)
 */
interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: {
    error?: 'DeviceNotRegistered' | 'InvalidCredentials' | 'MessageTooBig' | 'MessageRateExceeded';
  };
}

/**
 * Send push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
): Promise<void> {
  try {
    // Get user's Expo push tokens
    const tokens = await getUserExpoPushTokens(userId);

    if (tokens.length === 0) {
      console.log(`No Expo push tokens found for user ${userId}`);
      return;
    }

    // Create messages for each token
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: 'high',
      channelId: 'default',
    }));

    // Send notifications (Expo API supports batching up to 100)
    await sendExpoPushNotifications(messages);

    // Log notification
    await logNotification(userId, notification.title, notification.body);
  } catch (error) {
    console.error('Failed to send push notification:', error);
    // Don't throw - push notifications are not critical
  }
}

/**
 * Send push notifications via Expo Push API
 */
async function sendExpoPushNotifications(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) {
    return [];
  }

  try {
    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error('Expo Push API error:', response.status, response.statusText);
      return [];
    }

    const result = await response.json();
    const tickets: ExpoPushTicket[] = result.data || [];

    // Handle error tickets (e.g., deactivate invalid tokens)
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        // Token is no longer valid, deactivate it
        const token = messages[i].to;
        await deactivateExpoPushToken(token);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Failed to send Expo push notifications:', error);
    return [];
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
  },
): Promise<void> {
  // Collect all tokens from all users
  const allMessages: ExpoPushMessage[] = [];

  for (const userId of userIds) {
    const tokens = await getUserExpoPushTokens(userId);
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default' as const,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: 'high' as const,
      channelId: 'default',
    }));
    allMessages.push(...messages);
  }

  // Send all notifications in batches of 100
  const batchSize = 100;
  for (let i = 0; i < allMessages.length; i += batchSize) {
    const batch = allMessages.slice(i, i + batchSize);
    await sendExpoPushNotifications(batch);
  }

  // Log notifications for each user
  for (const userId of userIds) {
    await logNotification(userId, notification.title, notification.body);
  }
}

/**
 * Get user's Expo push tokens
 */
async function getUserExpoPushTokens(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();

  const {data, error} = await supabase
    .from('push_notification_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('Failed to fetch Expo push tokens:', error);
    return [];
  }

  return (data || []).map(row => row.token);
}

/**
 * Register Expo push token for user
 */
export async function registerExpoPushToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android',
): Promise<void> {
  // Validate Expo token format
  if (!token.startsWith('ExponentPushToken[') || !token.endsWith(']')) {
    console.error('Invalid Expo push token format:', token);
    return;
  }

  const supabase = getSupabaseClient();

  // Check if token already exists
  const {data: existing} = await supabase
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
    await supabase.from('push_notification_tokens').insert({
      user_id: userId,
      token,
      platform,
      active: true,
    });
  }
}

/**
 * Deactivate Expo push token (when it's invalid/expired)
 */
async function deactivateExpoPushToken(token: string): Promise<void> {
  const supabase = getSupabaseClient();

  await supabase
    .from('push_notification_tokens')
    .update({active: false})
    .eq('token', token);

  console.log(`Deactivated invalid Expo push token: ${token.substring(0, 30)}...`);
}

/**
 * Log notification to database
 */
async function logNotification(
  userId: string,
  title: string,
  body: string,
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
  memberName: string,
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
  minutesLate: number,
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
  newTime: string,
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
  isMember: boolean,
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
  isMember: boolean,
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

export async function sendWelcomeNotification(
  userId: string,
  name: string,
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Welcome to Pruuf!',
    body: `Welcome ${name}! Check in daily to keep your loved ones informed.`,
    data: {
      type: 'welcome',
    },
  });
}

export async function sendCheckInReminderNotification(
  userId: string,
  minutesUntilDeadline: number,
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Check-in Reminder',
    body: `Don't forget to check in! You have ${minutesUntilDeadline} minutes until your check-in time.`,
    data: {
      type: 'check_in_reminder',
      minutes_until_deadline: minutesUntilDeadline.toString(),
    },
  });
}

export async function sendCheckInConfirmationNotification(
  contactUserId: string,
  memberName: string,
): Promise<void> {
  await sendPushNotification(contactUserId, {
    title: 'Check-in Confirmed',
    body: `${memberName} has checked in and is okay.`,
    data: {
      type: 'check_in_confirmation',
      member_name: memberName,
    },
  });
}

export async function sendInvitationNotification(
  userId: string,
  inviterName: string,
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'New Invitation',
    body: `${inviterName} has invited you to connect on Pruuf.`,
    data: {
      type: 'invitation',
      inviter_name: inviterName,
    },
  });
}
