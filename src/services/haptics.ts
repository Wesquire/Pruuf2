/**
 * Haptics Service
 * Provides haptic feedback using Expo Haptics
 *
 * Migrated from react-native-haptic-feedback to expo-haptics
 * for Expo managed workflow compatibility
 */

import * as Haptics from 'expo-haptics';
import {Platform} from 'react-native';

/**
 * Trigger haptic feedback for button presses and interactions
 */
export const triggerImpact = async (
  style: 'light' | 'medium' | 'heavy' = 'medium',
): Promise<void> => {
  if (!isHapticsSupported()) return;

  try {
    const impactStyle =
      style === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : style === 'heavy'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium;

    await Haptics.impactAsync(impactStyle);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic feedback failed:', error);
  }
};

/**
 * Trigger haptic feedback for notifications (success, warning, error)
 */
export const triggerNotification = async (
  type: 'success' | 'warning' | 'error' = 'success',
): Promise<void> => {
  if (!isHapticsSupported()) return;

  try {
    const notificationType =
      type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : type === 'warning'
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Error;

    await Haptics.notificationAsync(notificationType);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic notification failed:', error);
  }
};

/**
 * Trigger selection feedback (for picker/selection changes)
 */
export const triggerSelection = async (): Promise<void> => {
  if (!isHapticsSupported()) return;

  try {
    await Haptics.selectionAsync();
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic selection failed:', error);
  }
};

/**
 * Check if haptics are supported on the current device
 */
export const isHapticsSupported = (): boolean => {
  // Haptics are supported on iOS and most Android devices
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

/**
 * Convenience function for check-in button haptic
 */
export const triggerCheckInHaptic = (): void => {
  triggerNotification('success');
};

/**
 * Convenience function for error haptic
 */
export const triggerErrorHaptic = (): void => {
  triggerNotification('error');
};

/**
 * Convenience function for button tap haptic
 */
export const triggerButtonHaptic = (): void => {
  triggerImpact('light');
};

export default {
  triggerImpact,
  triggerNotification,
  triggerSelection,
  isHapticsSupported,
  triggerCheckInHaptic,
  triggerErrorHaptic,
  triggerButtonHaptic,
};
