/**
 * Haptics Service
 * Provides haptic feedback using react-native-haptic-feedback
 *
 * Migrated from expo-haptics to react-native-haptic-feedback
 * for React Native 0.78 compatibility
 */

import ReactNativeHapticFeedback, {
  HapticFeedbackTypes,
} from 'react-native-haptic-feedback';
import {Platform} from 'react-native';

// Default haptic options
const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

/**
 * Trigger haptic feedback for button presses and interactions
 */
export const triggerImpact = (
  style: 'light' | 'medium' | 'heavy' = 'medium',
): void => {
  if (!isHapticsSupported()) return;

  try {
    const impactType: HapticFeedbackTypes =
      style === 'light'
        ? 'impactLight'
        : style === 'heavy'
          ? 'impactHeavy'
          : 'impactMedium';

    ReactNativeHapticFeedback.trigger(impactType, hapticOptions);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic feedback failed:', error);
  }
};

/**
 * Trigger haptic feedback for notifications (success, warning, error)
 */
export const triggerNotification = (
  type: 'success' | 'warning' | 'error' = 'success',
): void => {
  if (!isHapticsSupported()) return;

  try {
    const notificationType: HapticFeedbackTypes =
      type === 'success'
        ? 'notificationSuccess'
        : type === 'warning'
          ? 'notificationWarning'
          : 'notificationError';

    ReactNativeHapticFeedback.trigger(notificationType, hapticOptions);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug('Haptic notification failed:', error);
  }
};

/**
 * Trigger selection feedback (for picker/selection changes)
 */
export const triggerSelection = (): void => {
  if (!isHapticsSupported()) return;

  try {
    ReactNativeHapticFeedback.trigger('selection', hapticOptions);
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
