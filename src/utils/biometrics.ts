/**
 * Biometric Authentication Utilities
 * Item 29: Add Biometric Authentication (MEDIUM)
 *
 * Handles fingerprint and Face ID authentication using Expo Local Authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import {Platform} from 'react-native';

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | null;

export interface BiometricAvailability {
  available: boolean;
  biometryType: BiometricType;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    // Check if hardware is available
    const hasHardware = await LocalAuthentication.hasHardwareAsync();

    if (!hasHardware) {
      return {
        available: false,
        biometryType: null,
        error: 'Biometric authentication is not available on this device',
      };
    }

    // Check if biometrics are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!isEnrolled) {
      return {
        available: false,
        biometryType: null,
        error: 'No biometrics enrolled on this device',
      };
    }

    // Get supported authentication types
    const supportedTypes =
      await LocalAuthentication.supportedAuthenticationTypesAsync();

    let type: BiometricType = 'Biometrics';

    if (Platform.OS === 'ios') {
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
      ) {
        type = 'FaceID';
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        )
      ) {
        type = 'TouchID';
      }
    } else {
      // Android
      if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FINGERPRINT,
        )
      ) {
        type = 'Biometrics';
      } else if (
        supportedTypes.includes(
          LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        )
      ) {
        type = 'Biometrics';
      }
    }

    return {
      available: true,
      biometryType: type,
    };
  } catch (error) {
    return {
      available: false,
      biometryType: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string,
): Promise<BiometricAuthResult> {
  try {
    const message = promptMessage || getBiometricPromptMessage();

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: message,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Biometric authentication failed',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Get platform-specific biometric prompt message
 */
function getBiometricPromptMessage(): string {
  if (Platform.OS === 'ios') {
    return 'Authenticate to continue';
  }
  return 'Use your fingerprint to authenticate';
}

/**
 * Get user-friendly biometric type name
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case 'FaceID':
      return 'Face ID';
    case 'TouchID':
      return 'Touch ID';
    case 'Biometrics':
      return 'Biometric Authentication';
    default:
      return 'Biometric Authentication';
  }
}

/**
 * Enroll user for biometric authentication
 * Note: With Expo Local Authentication, we just verify the user can authenticate
 * There's no key management needed like with react-native-biometrics
 */
export async function enrollBiometrics(): Promise<{
  success: boolean;
  biometryType: BiometricType;
  error?: string;
}> {
  // Check availability first
  const availability = await checkBiometricAvailability();

  if (!availability.available) {
    return {
      success: false,
      biometryType: null,
      error: availability.error,
    };
  }

  // Test authentication
  const authResult = await authenticateWithBiometrics(
    'Verify your biometric authentication',
  );

  if (!authResult.success) {
    return {
      success: false,
      biometryType: availability.biometryType,
      error: authResult.error,
    };
  }

  return {
    success: true,
    biometryType: availability.biometryType,
  };
}

/**
 * Disable biometric authentication
 * Note: With Expo, there are no keys to delete - we just return success
 */
export async function disableBiometrics(): Promise<{
  success: boolean;
  error?: string;
}> {
  // No keys to delete with Expo Local Authentication
  return {success: true};
}

/**
 * Check if biometrics is enrolled
 * Note: With Expo, we just check if biometrics are available and device has enrolled biometrics
 */
export async function isBiometricsEnrolled(): Promise<boolean> {
  const availability = await checkBiometricAvailability();
  return availability.available;
}

// Legacy functions for backwards compatibility (no-ops with Expo)

/**
 * Create biometric keys (no-op with Expo Local Authentication)
 * @deprecated No longer needed with Expo Local Authentication
 */
export async function createBiometricKeys(): Promise<{
  success: boolean;
  error?: string;
}> {
  return {success: true};
}

/**
 * Delete biometric keys (no-op with Expo Local Authentication)
 * @deprecated No longer needed with Expo Local Authentication
 */
export async function deleteBiometricKeys(): Promise<{
  success: boolean;
  error?: string;
}> {
  return {success: true};
}

/**
 * Check if biometric keys exist (always true with Expo if biometrics available)
 * @deprecated No longer needed with Expo Local Authentication
 */
export async function biometricKeysExist(): Promise<boolean> {
  const availability = await checkBiometricAvailability();
  return availability.available;
}
