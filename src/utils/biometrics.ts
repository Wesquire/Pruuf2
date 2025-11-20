/**
 * Biometric Authentication Utilities
 * Item 29: Add Biometric Authentication (MEDIUM)
 *
 * Handles fingerprint and Face ID authentication
 */

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';

export type BiometricType = 'FaceID' | 'TouchID' | 'Biometrics' | null;

export interface BiometricAvailability {
  available: boolean;
  biometryType: BiometricType;
  error?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  signature?: string;
}

/**
 * Get biometrics instance
 */
function getBiometricsInstance() {
  return new ReactNativeBiometrics({
    allowDeviceCredentials: false,
  });
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const rnBiometrics = getBiometricsInstance();
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (!available) {
      return {
        available: false,
        biometryType: null,
        error: 'Biometric authentication is not available on this device',
      };
    }

    let type: BiometricType = null;

    if (biometryType === BiometryTypes.FaceID) {
      type = 'FaceID';
    } else if (biometryType === BiometryTypes.TouchID) {
      type = 'TouchID';
    } else if (biometryType === BiometryTypes.Biometrics) {
      type = 'Biometrics';
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
 * Create biometric keys for authentication
 */
export async function createBiometricKeys(): Promise<{ success: boolean; error?: string }> {
  try {
    const rnBiometrics = getBiometricsInstance();
    const { publicKey } = await rnBiometrics.createKeys();

    if (!publicKey) {
      return {
        success: false,
        error: 'Failed to create biometric keys',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create keys',
    };
  }
}

/**
 * Delete biometric keys
 */
export async function deleteBiometricKeys(): Promise<{ success: boolean; error?: string }> {
  try {
    const rnBiometrics = getBiometricsInstance();
    const { keysDeleted } = await rnBiometrics.deleteKeys();

    return {
      success: keysDeleted,
      error: keysDeleted ? undefined : 'Failed to delete keys',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete keys',
    };
  }
}

/**
 * Check if biometric keys exist
 */
export async function biometricKeysExist(): Promise<boolean> {
  try {
    const rnBiometrics = getBiometricsInstance();
    const { keysExist } = await rnBiometrics.biometricKeysExist();
    return keysExist;
  } catch (error) {
    console.error('Error checking biometric keys:', error);
    return false;
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string
): Promise<BiometricAuthResult> {
  try {
    const rnBiometrics = getBiometricsInstance();
    const message = promptMessage || getBiometricPromptMessage();

    const { success, signature } = await rnBiometrics.createSignature({
      promptMessage: message,
      payload: Date.now().toString(),
    });

    if (!success) {
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }

    return {
      success: true,
      signature,
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

  // Create keys
  const keysResult = await createBiometricKeys();

  if (!keysResult.success) {
    return {
      success: false,
      biometryType: availability.biometryType,
      error: keysResult.error,
    };
  }

  // Test authentication
  const authResult = await authenticateWithBiometrics(
    'Verify your biometric authentication'
  );

  if (!authResult.success) {
    // Clean up keys if auth fails
    await deleteBiometricKeys();

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
 */
export async function disableBiometrics(): Promise<{ success: boolean; error?: string }> {
  return deleteBiometricKeys();
}

/**
 * Check if biometrics is enrolled
 */
export async function isBiometricsEnrolled(): Promise<boolean> {
  const availability = await checkBiometricAvailability();

  if (!availability.available) {
    return false;
  }

  return biometricKeysExist();
}
