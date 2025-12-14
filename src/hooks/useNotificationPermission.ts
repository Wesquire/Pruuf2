/**
 * useNotificationPermission Hook
 * Item 37: Add Notification Permission Prompt (MEDIUM)
 *
 * Manages notification permission state and request flow
 */

import {useState, useEffect, useCallback} from 'react';
import {Platform, Alert, Linking} from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
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
 * Hook for managing notification permissions
 */
export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [state, setState] = useState<NotificationPermissionState>({
    status: 'undetermined',
    isLoading: false,
    shouldShowPrompt: false,
  });

  /**
   * Convert Firebase auth status to our PermissionStatus
   */
  const convertAuthStatus = (
    status: FirebaseMessagingTypes.AuthorizationStatus,
  ): PermissionStatus => {
    switch (status) {
      case messaging.AuthorizationStatus.AUTHORIZED:
      case messaging.AuthorizationStatus.PROVISIONAL:
        return 'granted';
      case messaging.AuthorizationStatus.DENIED:
        return 'denied';
      case messaging.AuthorizationStatus.NOT_DETERMINED:
      default:
        return 'undetermined';
    }
  };

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const authStatus = await messaging().hasPermission();
      const status = convertAuthStatus(authStatus);

      setState(prev => ({...prev, status}));
      return status;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'undetermined';
    }
  }, []);

  /**
   * Request notification permission from the system
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({...prev, isLoading: true}));

    try {
      const authStatus = await messaging().requestPermission();
      const status = convertAuthStatus(authStatus);

      const granted = status === 'granted';

      setState(prev => ({
        ...prev,
        status,
        isLoading: false,
        shouldShowPrompt: false,
      }));

      if (granted) {
        await markPromptShown();
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setState(prev => ({...prev, isLoading: false}));
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
