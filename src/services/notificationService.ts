/**
 * Local Notification Service
 * Handles local notifications for check-in reminders using Expo Notifications
 */

import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';

// Notification channel ID for Android
const REMINDER_CHANNEL_ID = 'check-in-reminders';

// Notification IDs for managing scheduled notifications
const CHECK_IN_REMINDER_ID = 'check-in-reminder';

/**
 * Initialize notification service
 * Sets up notification handler and creates Android notification channels
 */
export async function initializeNotifications(): Promise<void> {
  // Set notification handler for foreground notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });

  // Create Android notification channel for reminders
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Check-in Reminders',
      description: 'Reminders to check in with your loved ones',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }
}

/**
 * Request notification permissions
 * Returns true if permissions are granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const {status: existingStatus} = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const {status} = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  const {status} = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a daily check-in reminder notification
 * @param checkInTime - Time in HH:MM format
 * @param reminderMinutesBefore - Minutes before check-in time to send reminder (15, 30, or 60)
 * @param timezone - User's timezone (e.g., 'America/New_York')
 */
export async function scheduleCheckInReminder(
  checkInTime: string,
  reminderMinutesBefore: number,
  timezone: string,
): Promise<void> {
  // Cancel any existing reminder first
  await cancelCheckInReminder();

  // Parse check-in time
  const [hours, minutes] = checkInTime.split(':').map(Number);

  // Calculate reminder time (subtract minutes before)
  let reminderHour = hours;
  let reminderMinute = minutes - reminderMinutesBefore;

  // Handle minute underflow
  while (reminderMinute < 0) {
    reminderMinute += 60;
    reminderHour -= 1;
  }

  // Handle hour underflow
  if (reminderHour < 0) {
    reminderHour += 24;
  }

  // Schedule daily repeating notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Check In! 👋",
      body: "Your loved ones are waiting to hear from you. Tap to check in.",
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      ...(Platform.OS === 'android' && {channelId: REMINDER_CHANNEL_ID}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHour,
      minute: reminderMinute,
    },
    identifier: CHECK_IN_REMINDER_ID,
  });
}

/**
 * Cancel the scheduled check-in reminder
 */
export async function cancelCheckInReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(CHECK_IN_REMINDER_ID);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Show an immediate notification
 */
export async function showImmediateNotification(
  title: string,
  message: string,
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: message,
      sound: true,
      ...(Platform.OS === 'android' && {channelId: REMINDER_CHANNEL_ID}),
    },
    trigger: null, // null trigger = immediate notification
  });
}

/**
 * Get all scheduled local notifications
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Update check-in reminder when settings change
 */
export async function updateCheckInReminder(
  enabled: boolean,
  checkInTime: string | null,
  reminderMinutesBefore: number,
  timezone: string,
): Promise<void> {
  if (!enabled || !checkInTime) {
    await cancelCheckInReminder();
    return;
  }

  await scheduleCheckInReminder(checkInTime, reminderMinutesBefore, timezone);
}
