/**
 * Push Notifications Service
 * Handles Firebase Cloud Messaging setup and token management
 */

import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {pushAPI} from './api';

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted:', authStatus);
    } else {
      console.log('Notification permission denied');
    }

    return enabled;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the FCM token for this device
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 */
export async function registerFCMToken(): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();

    if (!hasPermission) {
      console.log(
        'Notification permission not granted, skipping token registration',
      );
      return;
    }

    const token = await getFCMToken();

    if (!token) {
      console.error('Failed to get FCM token');
      return;
    }

    // Register token with backend
    await pushAPI.registerToken(token, Platform.OS);
    console.log('FCM token registered with backend');
  } catch (error) {
    console.error('Error registering FCM token:', error);
  }
}

/**
 * Setup notification listeners
 */
export function setupNotificationListeners(): () => void {
  // Handle notification when app is in foreground
  const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
    console.log('Foreground notification received:', remoteMessage);

    // You can display a local notification here or update the UI
    // For now, we'll just log it
    if (remoteMessage.notification) {
      console.log(
        'Notification:',
        remoteMessage.notification.title,
        remoteMessage.notification.body,
      );
    }
  });

  // Handle notification tap when app is in background
  const unsubscribeBackground = messaging().onNotificationOpenedApp(
    remoteMessage => {
      console.log(
        'Notification caused app to open from background:',
        remoteMessage,
      );

      // Handle navigation based on notification data
      if (remoteMessage.data) {
        handleNotificationNavigation(remoteMessage.data);
      }
    },
  );

  // Check if app was opened from a notification when it was quit
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log(
          'Notification caused app to open from quit state:',
          remoteMessage,
        );

        if (remoteMessage.data) {
          handleNotificationNavigation(remoteMessage.data);
        }
      }
    });

  // Handle token refresh
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
    console.log('FCM token refreshed:', token);

    try {
      await pushAPI.registerToken(token, Platform.OS);
      console.log('Refreshed FCM token registered with backend');
    } catch (error) {
      console.error('Error registering refreshed FCM token:', error);
    }
  });

  // Return cleanup function
  return () => {
    unsubscribeForeground();
    unsubscribeBackground();
    unsubscribeTokenRefresh();
  };
}

/**
 * Handle navigation based on notification data
 */
function handleNotificationNavigation(data: {[key: string]: string}): void {
  console.log('Handling notification navigation with data:', data);

  // This will be implemented once navigation ref is set up
  // Example: navigate to specific screen based on notification type

  if (data.type === 'missed_checkin') {
    // Navigate to member detail screen
    console.log('Navigate to member detail:', data.member_id);
  } else if (data.type === 'reminder') {
    // Navigate to check-in screen
    console.log('Navigate to check-in screen');
  }
}

/**
 * Request iOS-specific notification permissions
 * Call this after user has been using the app for a while
 */
export async function requestIOSNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return true;
  }

  try {
    const authStatus = await messaging().requestPermission({
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      provisional: false,
      sound: true,
    });

    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('Error requesting iOS notification permissions:', error);
    return false;
  }
}
