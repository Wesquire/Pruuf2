/**
 * Notification Components Export
 * Item 37: Add Notification Permission Prompt (MEDIUM)
 */

export {NotificationPermissionPrompt} from './NotificationPermissionPrompt';
export type {NotificationPermissionPromptProps} from './NotificationPermissionPrompt';
export {
  useNotificationPermission,
  showPermissionDeniedAlert,
  type PermissionStatus,
  type NotificationPermissionState,
  type UseNotificationPermissionReturn,
} from '../../hooks/useNotificationPermission';
