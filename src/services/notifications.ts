/**
 * Push Notifications Service
 * Handles push notification registration and listeners using Expo Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {pushAPI} from './api';
import {handleNotificationNavigation} from './navigationService';

// Types for notification data
export interface NotificationData {
  type?: string;
  member_id?: string;
  [key: string]: string | undefined;
}

/**
 * Register for push notifications and get Expo Push Token
 * Returns the token string or null if registration fails
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const {status: existingStatus} = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const {status} = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Failed to get Expo Push Token:', error);
    return null;
  }
}

/**
 * Request notification permissions from the user
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
 * Get the push token for this device (Expo Push Token)
 */
export async function getExpoPushToken(): Promise<string | null> {
  return registerForPushNotificationsAsync();
}

/**
 * Register push token with backend
 */
export async function registerPushToken(): Promise<void> {
  const token = await registerForPushNotificationsAsync();

  if (!token) {
    console.log('No push token available to register');
    return;
  }

  try {
    await pushAPI.registerToken(token, Platform.OS);
    console.log('Push token registered successfully');
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
  }
}

/**
 * Setup notification listeners
 * Returns a cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (
    response: Notifications.NotificationResponse,
  ) => void,
): () => void {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    },
  );

  // Listener for when user interacts with notification
  const responseListener =
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const data = response.notification.request.content
        .data as NotificationData;
      handleNotificationNavigation(data);
      onNotificationResponse?.(response);
    });

  // Return cleanup function
  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}

// handleNotificationNavigation is now imported from navigationService.ts

/**
 * Request iOS-specific notification permissions
 */
export async function requestIOSNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }

  return requestNotificationPermissions();
}

/**
 * Get the last notification response (for handling app launch from notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

