/**
 * Local Notification Service
 * Handles scheduling and managing local notifications for check-in reminders
 * Supports both iOS and Android platforms
 */

import PushNotification, {Importance} from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {Platform} from 'react-native';
import moment from 'moment-timezone';

/**
 * Initialize notification service
 */
export function initializeNotifications(): void {
  // Configure push notifications
  PushNotification.configure({
    // Called when a remote or local notification is opened or received
    onNotification: function (notification: any) {
      console.log('LOCAL NOTIFICATION:', notification);

      // iOS: Call finish on notification
      if (Platform.OS === 'ios') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },

    // Android only: GCM or FCM Sender ID
    senderID: 'YOUR_SENDER_ID',

    // IOS only: Permissions
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // Should the initial notification be popped automatically (default: true)
    popInitialNotification: true,

    // Request permissions (iOS only)
    requestPermissions: Platform.OS === 'ios',
  });

  // Create notification channel for Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'check-in-reminders',
        channelName: 'Check-in Reminders',
        channelDescription: 'Daily check-in reminder notifications',
        playSound: true,
        soundName: 'default',
        importance: Importance.HIGH,
        vibrate: true,
      },
      (created: boolean) => console.log(`Android channel created: ${created}`),
    );
  }
}

/**
 * Request notification permissions (iOS)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const permissions = await PushNotificationIOS.requestPermissions({
      alert: true,
      badge: true,
      sound: true,
    });

    return permissions.alert && permissions.sound;
  }

  // Android: Permissions granted by default on install
  return true;
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const settings = await PushNotificationIOS.checkPermissions();
    return settings.alert === 1 && settings.sound === 1;
  }

  // Android: Always returns true (permissions granted on install)
  return true;
}

/**
 * Schedule a daily check-in reminder notification
 */
export function scheduleCheckInReminder(
  checkInTime: string, // HH:MM format
  reminderMinutesBefore: number, // 15, 30, or 60
  timezone: string,
): void {
  // Cancel any existing reminder
  cancelCheckInReminder();

  // Parse check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Calculate reminder time
  const reminderMoment = moment.tz(timezone);
  reminderMoment.set({hour: hours, minute: minutes, second: 0, millisecond: 0});
  reminderMoment.subtract(reminderMinutesBefore, 'minutes');

  // If reminder time has passed today, schedule for tomorrow
  if (reminderMoment.isBefore(moment())) {
    reminderMoment.add(1, 'day');
  }

  const reminderDate = reminderMoment.toDate();

  console.log(`Scheduling reminder for: ${reminderDate.toISOString()}`);

  // Schedule the notification
  PushNotification.localNotificationSchedule({
    id: 'check-in-reminder', // Fixed ID for easy cancellation
    channelId: 'check-in-reminders', // Android only
    title: 'Time to Check In!',
    message: `Your check-in time is in ${reminderMinutesBefore} minutes. Don't forget to tap "I'm OK"!`,
    date: reminderDate,
    allowWhileIdle: true, // Android only
    repeatType: 'day', // Repeat daily
    playSound: true,
    soundName: 'default',
    importance: 'high' as any, // Android only
    vibrate: true,
    vibration: 300,
  });
}

/**
 * Cancel the scheduled check-in reminder
 */
export function cancelCheckInReminder(): void {
  PushNotification.cancelLocalNotification('check-in-reminder');
  console.log('Check-in reminder cancelled');
}

/**
 * Cancel all scheduled notifications
 */
export function cancelAllNotifications(): void {
  PushNotification.cancelAllLocalNotifications();
  console.log('All notifications cancelled');
}

/**
 * Show immediate notification (for testing)
 */
export function showImmediateNotification(
  title: string,
  message: string,
): void {
  PushNotification.localNotification({
    channelId: 'check-in-reminders',
    title,
    message,
    playSound: true,
    soundName: 'default',
    importance: 'high' as any,
    vibrate: true,
    vibration: 300,
  });
}

/**
 * Get all scheduled local notifications
 */
export function getScheduledNotifications(): Promise<any[]> {
  return new Promise(resolve => {
    PushNotification.getScheduledLocalNotifications((notifications: any[]) => {
      resolve(notifications);
    });
  });
}

/**
 * Clear badge count (iOS only)
 */
export function clearBadgeCount(): void {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.setApplicationIconBadgeNumber(0);
  } else {
    PushNotification.setApplicationIconBadgeNumber(0);
  }
}

/**
 * Set badge count (iOS only)
 */
export function setBadgeCount(count: number): void {
  if (Platform.OS === 'ios') {
    PushNotificationIOS.setApplicationIconBadgeNumber(count);
  } else {
    PushNotification.setApplicationIconBadgeNumber(count);
  }
}

/**
 * Update check-in reminder when settings change
 */
export function updateCheckInReminder(
  enabled: boolean,
  checkInTime: string | null,
  reminderMinutesBefore: number,
  timezone: string,
): void {
  if (!enabled || !checkInTime) {
    // Reminder disabled or no check-in time set
    cancelCheckInReminder();
    return;
  }

  // Schedule new reminder
  scheduleCheckInReminder(checkInTime, reminderMinutesBefore, timezone);
}
