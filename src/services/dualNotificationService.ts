/**
 * Dual Notification Service
 *
 * Manages dual notification strategy: Push + Email for critical alerts
 * Implements priority-based delivery with fallback mechanisms
 * Uses expo-notifications (replaces @react-native-firebase/messaging)
 *
 * Architecture:
 * - CRITICAL notifications → Push + Email (always both)
 * - HIGH notifications → Push first, Email fallback if push fails
 * - NORMAL notifications → Push only
 * - LOW notifications → Push only, can be batched
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_BASE_URL } from '../constants/config';

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  CRITICAL = 'critical',  // Push + Email (missed check-in, payment failed)
  HIGH = 'high',          // Push + Email retry if push fails
  NORMAL = 'normal',      // Push only (check-in confirmation, reminders)
  LOW = 'low',            // Push only, can be batched
}

/**
 * Notification types
 */
export enum NotificationType {
  // Critical (always Push + Email)
  MISSED_CHECK_IN = 'missed_check_in',
  PAYMENT_FAILED = 'payment_failed',
  ACCOUNT_FROZEN = 'account_frozen',

  // High priority (Push + Email if push fails)
  CHECK_IN_CONFIRMATION = 'check_in_confirmation',
  LATE_CHECK_IN = 'late_check_in',
  MEMBER_CONNECTED = 'member_connected',

  // Normal priority (Push only)
  CHECK_IN_REMINDER = 'check_in_reminder',
  TRIAL_REMINDER = 'trial_reminder',
  INVITATION_SENT = 'invitation_sent',

  // Low priority (Push only, can be batched)
  WEEKLY_SUMMARY = 'weekly_summary',
  FEATURE_ANNOUNCEMENT = 'feature_announcement',
}

/**
 * Get notification priority for a given type
 */
export function getNotificationPriority(type: NotificationType): NotificationPriority {
  const criticalTypes = [
    NotificationType.MISSED_CHECK_IN,
    NotificationType.PAYMENT_FAILED,
    NotificationType.ACCOUNT_FROZEN,
  ];

  const highTypes = [
    NotificationType.CHECK_IN_CONFIRMATION,
    NotificationType.LATE_CHECK_IN,
    NotificationType.MEMBER_CONNECTED,
  ];

  if (criticalTypes.includes(type)) {
    return NotificationPriority.CRITICAL;
  }

  if (highTypes.includes(type)) {
    return NotificationPriority.HIGH;
  }

  return NotificationPriority.NORMAL;
}

/**
 * Notification payload interface
 */
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: string;
  userEmail?: string;
}

/**
 * Notification delivery result
 */
export interface NotificationResult {
  pushSent: boolean;
  emailSent: boolean;
  error?: string;
}

/**
 * Send notification with appropriate delivery strategy
 */
export async function sendNotification(
  payload: NotificationPayload,
  accessToken: string
): Promise<NotificationResult> {
  const priority = getNotificationPriority(payload.type);

  const result: NotificationResult = {
    pushSent: false,
    emailSent: false,
  };

  // Strategy 1: CRITICAL - Always send both Push + Email
  if (priority === NotificationPriority.CRITICAL) {
    // Send push notification
    result.pushSent = await sendPushNotification(payload, accessToken);

    // Send email notification (always, even if push succeeded)
    if (payload.userEmail) {
      result.emailSent = await sendEmailNotification(payload, accessToken);
    }

    return result;
  }

  // Strategy 2: HIGH - Try push first, send email if push fails
  if (priority === NotificationPriority.HIGH) {
    result.pushSent = await sendPushNotification(payload, accessToken);

    if (!result.pushSent && payload.userEmail) {
      // Push failed, use email as fallback
      result.emailSent = await sendEmailNotification(payload, accessToken);
    }

    return result;
  }

  // Strategy 3: NORMAL/LOW - Push only
  result.pushSent = await sendPushNotification(payload, accessToken);

  return result;
}

/**
 * Send push notification via backend API
 */
async function sendPushNotification(
  payload: NotificationPayload,
  accessToken: string
): Promise<boolean> {
  try {
    // Check if user has granted push notification permission
    const { status } = await Notifications.getPermissionsAsync();
    const enabled = status === 'granted';

    if (!enabled) {
      console.log('Push notifications not enabled for user');
      return false;
    }

    // Send push notification via backend API
    const response = await fetch(`${API_BASE_URL}/api/notifications/send-push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: payload.userId,
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...payload.data,
        },
        priority: getNotificationPriority(payload.type),
      }),
    });

    const data = await response.json();
    return data.success === true;

  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send email notification via Postmark
 */
async function sendEmailNotification(
  payload: NotificationPayload,
  accessToken: string
): Promise<boolean> {
  try {
    if (!payload.userEmail) {
      console.log('No email address provided for email notification');
      return false;
    }

    // Send email notification via backend API
    const response = await fetch(`${API_BASE_URL}/api/notifications/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: payload.userEmail,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload.data,
      }),
    });

    const data = await response.json();
    return data.success === true;

  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const enabled = finalStatus === 'granted';

    if (enabled) {
      console.log('Push notification permission granted');

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      console.log('Expo Push Token:', tokenData.data);

      return true;
    } else {
      console.log('Push notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting push permission:', error);
    return false;
  }
}

/**
 * Handle incoming push notification (foreground)
 */
export function onForegroundNotification(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener((notification) => {
    console.log('Foreground notification:', notification);
    handler(notification);
  });
}

/**
 * Handle notification tap (background/quit)
 */
export function onNotificationTap(
  handler: (response: Notifications.NotificationResponse) => void
): void {
  // Check if app was opened from a notification when it was quit
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      console.log('Notification opened app from quit state:', response);
      handler(response);
    }
  });

  // Handle notification taps while app is running
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response received:', response);
    handler(response);
  });
}

/**
 * Get push token for current device (Expo push token)
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('Push tokens require a physical device');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token with backend
 */
export async function registerFCMToken(
  token: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcm_token: token,
        platform: Platform.OS,
        device_info: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      }),
    });

    const data = await response.json();
    return data.success === true;

  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

/**
 * Batch send multiple notifications (for low-priority bulk sends)
 */
export async function sendBatchNotifications(
  payloads: NotificationPayload[],
  accessToken: string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const payload of payloads) {
    const result = await sendNotification(payload, accessToken);
    results.push(result);
  }

  return results;
}
