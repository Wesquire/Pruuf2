/**
 * Haptics Service
 * Provides haptic feedback using expo-haptics
 * Replaces react-native-haptic-feedback
 */

import * as Haptics from 'expo-haptics';
import {Platform} from 'react-native';

/**
 * Trigger haptic feedback for button presses and interactions
 */
export const triggerImpact = async (
  style: 'light' | 'medium' | 'heavy' = 'medium',
): Promise<void> => {
  try {
    const impactStyle = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    }[style];

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
  try {
    const notificationType = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    }[type];

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
export const triggerCheckInHaptic = async (): Promise<void> => {
  await triggerNotification('success');
};

/**
 * Convenience function for error haptic
 */
export const triggerErrorHaptic = async (): Promise<void> => {
  await triggerNotification('error');
};

/**
 * Convenience function for button tap haptic
 */
export const triggerButtonHaptic = async (): Promise<void> => {
  await triggerImpact('light');
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
