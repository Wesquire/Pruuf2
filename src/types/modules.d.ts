/**
 * Type declarations for modules without TypeScript support
 * Updated for Expo migration - Firebase and push notification modules removed
 */

// Expo Haptics
declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
  }

  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }

  export function impactAsync(style: ImpactFeedbackStyle): Promise<void>;
  export function notificationAsync(
    type: NotificationFeedbackType,
  ): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

// Note: Firebase Analytics, react-native-push-notification, and
// @react-native-community/push-notification-ios declarations removed
// These will be replaced with Expo Notifications in Phase 6
