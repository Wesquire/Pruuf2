/**
 * useNotificationPermission Hook
 * Item 37: Add Notification Permission Prompt (MEDIUM)
 *
 * Uses Expo Notifications for push notification permissions
 */

import {useState, useEffect, useCallback} from 'react';
import {Platform, Alert, Linking} from 'react-native';
import * as Notifications from 'expo-notifications';
import {storage} from '../services/storage';

export type PermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'limited';

export interface NotificationPermissionState {
  status: PermissionStatus;
  isLoading: boolean;
  shouldShowPrompt: boolean;
}

export interface UseNotificationPermissionReturn {
  state: NotificationPermissionState;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<PermissionStatus>;
  showPrompt: () => void;
  hidePrompt: () => void;
  openSettings: () => void;
  markPromptShown: () => Promise<void>;
}

const STORAGE_KEY_PROMPT_SHOWN = 'notification_prompt_shown';
const STORAGE_KEY_PROMPT_DISMISSED_COUNT =
  'notification_prompt_dismissed_count';
const MAX_DISMISSALS = 3;

/**
 * Map Expo permission status to our PermissionStatus type
 */
function mapExpoStatus(
  expoStatus: Notifications.PermissionStatus,
): PermissionStatus {
  switch (expoStatus) {
    case 'granted':
      return 'granted';
    case 'denied':
      return 'denied';
    case 'undetermined':
    default:
      return 'undetermined';
  }
}

/**
 * Hook for managing notification permissions
 * Uses Expo Notifications API
 */
export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [state, setState] = useState<NotificationPermissionState>({
    status: 'undetermined',
    isLoading: false,
    shouldShowPrompt: false,
  });

  /**
   * Check current permission status using Expo Notifications
   */
  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const {status} = await Notifications.getPermissionsAsync();
      const mappedStatus = mapExpoStatus(status);
      setState(prev => ({...prev, status: mappedStatus}));
      return mappedStatus;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'undetermined';
    }
  }, []);

  /**
   * Request notification permission from the system using Expo Notifications
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({...prev, isLoading: true}));

    try {
      const {status} = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      const mappedStatus = mapExpoStatus(status);
      const granted = status === 'granted';

      setState(prev => ({
        ...prev,
        status: mappedStatus,
        isLoading: false,
        shouldShowPrompt: false,
      }));

      await markPromptShown();
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      return false;
    }
  }, []);

  /**
   * Show the permission prompt
   */
  const showPrompt = useCallback(() => {
    setState(prev => ({...prev, shouldShowPrompt: true}));
  }, []);

  /**
   * Hide the permission prompt
   */
  const hidePrompt = useCallback(async () => {
    setState(prev => ({...prev, shouldShowPrompt: false}));

    // Increment dismissal count
    try {
      const countStr = await storage.getItem(
        STORAGE_KEY_PROMPT_DISMISSED_COUNT,
      );
      const count = countStr ? parseInt(countStr, 10) : 0;
      await storage.setItem(
        STORAGE_KEY_PROMPT_DISMISSED_COUNT,
        String(count + 1),
      );
    } catch (error) {
      console.error('Error updating dismissal count:', error);
    }
  }, []);

  /**
   * Open system settings
   */
  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  /**
   * Mark that we've shown the prompt
   */
  const markPromptShown = useCallback(async (): Promise<void> => {
    try {
      await storage.setItem(STORAGE_KEY_PROMPT_SHOWN, 'true');
    } catch (error) {
      console.error('Error marking prompt as shown:', error);
    }
  }, []);

  /**
   * Determine if we should show the prompt automatically
   */
  const shouldAutoShowPrompt = useCallback(async (): Promise<boolean> => {
    try {
      // Don't show if already shown before
      const hasShown = await storage.getItem(STORAGE_KEY_PROMPT_SHOWN);
      if (hasShown === 'true') {
        return false;
      }

      // Don't show if dismissed too many times
      const countStr = await storage.getItem(
        STORAGE_KEY_PROMPT_DISMISSED_COUNT,
      );
      const dismissalCount = countStr ? parseInt(countStr, 10) : 0;
      if (dismissalCount >= MAX_DISMISSALS) {
        return false;
      }

      // Check current permission status
      const status = await checkPermission();

      // Show only if undetermined
      return status === 'undetermined';
    } catch (error) {
      console.error('Error checking if should show prompt:', error);
      return false;
    }
  }, [checkPermission]);

  /**
   * Initialize permission state
   */
  useEffect(() => {
    const initialize = async () => {
      setState(prev => ({...prev, isLoading: true}));

      const status = await checkPermission();
      const shouldShow = await shouldAutoShowPrompt();

      setState(prev => ({
        ...prev,
        status,
        isLoading: false,
        shouldShowPrompt: shouldShow,
      }));
    };

    initialize();
  }, [checkPermission, shouldAutoShowPrompt]);

  return {
    state,
    requestPermission,
    checkPermission,
    showPrompt,
    hidePrompt,
    openSettings,
    markPromptShown,
  };
}

/**
 * Show denied permission alert
 */
export function showPermissionDeniedAlert(openSettings: () => void): void {
  Alert.alert(
    'Notifications Disabled',
    'To receive important alerts about check-ins, please enable notifications in your device settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: openSettings,
      },
    ],
  );
}
