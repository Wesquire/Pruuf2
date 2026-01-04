/**
 * Biometric Authentication Tests
 * Item 29: Add Biometric Authentication (MEDIUM)
 *
 * Tests for Expo Local Authentication integration
 */

import * as LocalAuthentication from 'expo-local-authentication';
import {
  checkBiometricAvailability,
  createBiometricKeys,
  deleteBiometricKeys,
  biometricKeysExist,
  authenticateWithBiometrics,
  getBiometricTypeName,
  enrollBiometrics,
  disableBiometrics,
  isBiometricsEnrolled,
} from '../utils/biometrics';

// Get mocked module
const MockedLocalAuth = LocalAuthentication as jest.Mocked<
  typeof LocalAuthentication
>;

describe('Biometrics - Check Availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect Face ID availability on iOS', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('FaceID');
    expect(result.error).toBeUndefined();
  });

  it('should detect Touch ID availability on iOS', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('TouchID');
  });

  it('should detect generic biometrics when multiple types available', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    ]);

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(true);
    // On iOS, Face ID takes precedence
    expect(result.biometryType).toBe('FaceID');
  });

  it('should handle no hardware available', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(false);

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(false);
    expect(result.biometryType).toBe(null);
    expect(result.error).toBe(
      'Biometric authentication is not available on this device',
    );
  });

  it('should handle no biometrics enrolled', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(false);

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(false);
    expect(result.biometryType).toBe(null);
    expect(result.error).toBe('No biometrics enrolled on this device');
  });

  it('should handle errors during availability check', async () => {
    MockedLocalAuth.hasHardwareAsync.mockRejectedValue(
      new Error('Sensor error'),
    );

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(false);
    expect(result.error).toBe('Sensor error');
  });
});

describe('Biometrics - Key Management (Legacy No-ops)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should always return success for createBiometricKeys (no-op)', async () => {
    const result = await createBiometricKeys();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should always return success for deleteBiometricKeys (no-op)', async () => {
    const result = await deleteBiometricKeys();

    expect(result.success).toBe(true);
  });

  it('should return availability status for biometricKeysExist', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const result = await biometricKeysExist();

    expect(result).toBe(true);
  });

  it('should return false for biometricKeysExist when not available', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(false);

    const result = await biometricKeysExist();

    expect(result).toBe(false);
  });
});

describe('Biometrics - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should authenticate successfully', async () => {
    MockedLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
    });

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should use custom prompt message', async () => {
    MockedLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
    });

    await authenticateWithBiometrics('Custom message');

    expect(MockedLocalAuth.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: 'Custom message',
      }),
    );
  });

  it('should handle authentication failure', async () => {
    MockedLocalAuth.authenticateAsync.mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle authentication errors', async () => {
    MockedLocalAuth.authenticateAsync.mockRejectedValue(
      new Error('Auth error'),
    );

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Auth error');
  });
});

describe('Biometrics - Type Names', () => {
  it('should get Face ID name', () => {
    expect(getBiometricTypeName('FaceID')).toBe('Face ID');
  });

  it('should get Touch ID name', () => {
    expect(getBiometricTypeName('TouchID')).toBe('Touch ID');
  });

  it('should get Biometrics name', () => {
    expect(getBiometricTypeName('Biometrics')).toBe('Biometric Authentication');
  });

  it('should handle null type', () => {
    expect(getBiometricTypeName(null)).toBe('Biometric Authentication');
  });
});

describe('Biometrics - Enrollment Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should enroll successfully', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    MockedLocalAuth.authenticateAsync.mockResolvedValue({
      success: true,
    });

    const result = await enrollBiometrics();

    expect(result.success).toBe(true);
    expect(result.biometryType).toBe('TouchID');
    expect(result.error).toBeUndefined();
  });

  it('should fail if biometrics unavailable', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(false);

    const result = await enrollBiometrics();

    expect(result.success).toBe(false);
    expect(result.biometryType).toBe(null);
    expect(result.error).toBeDefined();
  });

  it('should fail if authentication fails during enrollment', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    MockedLocalAuth.authenticateAsync.mockResolvedValue({
      success: false,
      error: 'user_cancel',
    });

    const result = await enrollBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Biometrics - Disable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should disable biometrics successfully (always succeeds with Expo)', async () => {
    const result = await disableBiometrics();

    expect(result.success).toBe(true);
  });
});

describe('Biometrics - Enrollment Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if biometrics available', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(true);
    MockedLocalAuth.supportedAuthenticationTypesAsync.mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);

    const result = await isBiometricsEnrolled();

    expect(result).toBe(true);
  });

  it('should return false if not enrolled on device', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(true);
    MockedLocalAuth.isEnrolledAsync.mockResolvedValue(false);

    const result = await isBiometricsEnrolled();

    expect(result).toBe(false);
  });

  it('should return false if no hardware available', async () => {
    MockedLocalAuth.hasHardwareAsync.mockResolvedValue(false);

    const result = await isBiometricsEnrolled();

    expect(result).toBe(false);
  });
});
