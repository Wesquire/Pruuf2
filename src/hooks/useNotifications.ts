/**
 * useNotifications Hook
 * React hook for managing push notifications
 */

import {useEffect, useState} from 'react';
import {
  requestNotificationPermissions,
  registerFCMToken,
  setupNotificationListeners,
} from '../services/notifications';

export interface NotificationPermissionStatus {
  hasPermission: boolean;
  isLoading: boolean;
}

/**
 * Hook to manage push notifications setup and permissions
 */
export function useNotifications() {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>({
      hasPermission: false,
      isLoading: true,
    });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeNotifications = async () => {
      try {
        // Request permissions
        const hasPermission = await requestNotificationPermissions();
        setPermissionStatus({
          hasPermission,
          isLoading: false,
        });

        if (hasPermission) {
          // Register token with backend
          await registerFCMToken();

          // Setup listeners
          unsubscribe = setupNotificationListeners();
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setPermissionStatus({
          hasPermission: false,
          isLoading: false,
        });
      }
    };

    initializeNotifications();

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setPermissionStatus({
      hasPermission: granted,
      isLoading: false,
    });

    if (granted) {
      await registerFCMToken();
    }

    return granted;
  };

  return {
    ...permissionStatus,
    requestPermission,
  };
}
