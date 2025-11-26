/**
 * Biometric Authentication Tests
 * Item 29: Add Biometric Authentication (MEDIUM)
 */

import { BiometryTypes } from 'react-native-biometrics';
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

// Mock module with jest
jest.mock('react-native-biometrics');

// Import after mocking
import ReactNativeBiometrics from 'react-native-biometrics';

const MockedBiometrics = ReactNativeBiometrics as jest.MockedClass<typeof ReactNativeBiometrics>;

describe('Biometrics - Check Availability', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = {
      isSensorAvailable: jest.fn(),
      createKeys: jest.fn(),
      deleteKeys: jest.fn(),
      biometricKeysExist: jest.fn(),
      createSignature: jest.fn(),
    };
    (MockedBiometrics as any).mockReturnValue(mockInstance);
  });

  it('should detect Face ID availability', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.FaceID,
    });

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('FaceID');
    expect(result.error).toBeUndefined();
  });

  it('should detect Touch ID availability', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.TouchID,
    });

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('TouchID');
  });

  it('should detect generic biometrics', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.Biometrics,
    });

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(true);
    expect(result.biometryType).toBe('Biometrics');
  });

  it('should handle unavailable biometrics', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: false,
      biometryType: undefined,
    });

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(false);
    expect(result.biometryType).toBe(null);
    expect(result.error).toBeDefined();
  });

  it('should handle errors during availability check', async () => {
    mockInstance.isSensorAvailable.mockRejectedValue(new Error('Sensor error'));

    const result = await checkBiometricAvailability();

    expect(result.available).toBe(false);
    expect(result.error).toBe('Sensor error');
  });
});

describe('Biometrics - Key Management', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = {
      isSensorAvailable: jest.fn(),
      createKeys: jest.fn(),
      deleteKeys: jest.fn(),
      biometricKeysExist: jest.fn(),
      createSignature: jest.fn(),
    };
    (MockedBiometrics as any).mockReturnValue(mockInstance);
  });

  it('should create biometric keys successfully', async () => {
    mockInstance.createKeys.mockResolvedValue({ publicKey: 'mock-public-key' });

    const result = await createBiometricKeys();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should handle key creation failure', async () => {
    mockInstance.createKeys.mockResolvedValue({ publicKey: null });

    const result = await createBiometricKeys();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should delete biometric keys successfully', async () => {
    mockInstance.deleteKeys.mockResolvedValue({ keysDeleted: true });

    const result = await deleteBiometricKeys();

    expect(result.success).toBe(true);
  });

  it('should handle key deletion failure', async () => {
    mockInstance.deleteKeys.mockResolvedValue({ keysDeleted: false });

    const result = await deleteBiometricKeys();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should check if keys exist', async () => {
    mockInstance.biometricKeysExist.mockResolvedValue({ keysExist: true });

    const result = await biometricKeysExist();

    expect(result).toBe(true);
  });

  it('should handle errors when checking keys', async () => {
    mockInstance.biometricKeysExist.mockRejectedValue(new Error('Check failed'));

    const result = await biometricKeysExist();

    expect(result).toBe(false);
  });
});

describe('Biometrics - Authentication', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = {
      isSensorAvailable: jest.fn(),
      createKeys: jest.fn(),
      deleteKeys: jest.fn(),
      biometricKeysExist: jest.fn(),
      createSignature: jest.fn(),
    };
    (MockedBiometrics as any).mockReturnValue(mockInstance);
  });

  it('should authenticate successfully', async () => {
    mockInstance.createSignature.mockResolvedValue({
      success: true,
      signature: 'mock-signature',
    });

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(true);
    expect(result.signature).toBe('mock-signature');
    expect(result.error).toBeUndefined();
  });

  it('should use custom prompt message', async () => {
    mockInstance.createSignature.mockResolvedValue({
      success: true,
      signature: 'mock-signature',
    });

    await authenticateWithBiometrics('Custom message');

    expect(mockInstance.createSignature).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: 'Custom message',
      })
    );
  });

  it('should handle authentication failure', async () => {
    mockInstance.createSignature.mockResolvedValue({
      success: false,
    });

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle authentication errors', async () => {
    mockInstance.createSignature.mockRejectedValue(new Error('Auth error'));

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
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = {
      isSensorAvailable: jest.fn(),
      createKeys: jest.fn(),
      deleteKeys: jest.fn(),
      biometricKeysExist: jest.fn(),
      createSignature: jest.fn(),
    };
    (MockedBiometrics as any).mockReturnValue(mockInstance);
  });

  it('should enroll successfully', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.TouchID,
    });
    mockInstance.createKeys.mockResolvedValue({ publicKey: 'key' });
    mockInstance.createSignature.mockResolvedValue({ success: true, signature: 'sig' });

    const result = await enrollBiometrics();

    expect(result.success).toBe(true);
    expect(result.biometryType).toBe('TouchID');
    expect(result.error).toBeUndefined();
  });

  it('should fail if biometrics unavailable', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: false,
    });

    const result = await enrollBiometrics();

    expect(result.success).toBe(false);
    expect(result.biometryType).toBe(null);
    expect(result.error).toBeDefined();
  });

  it('should fail if key creation fails', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.TouchID,
    });
    mockInstance.createKeys.mockResolvedValue({ publicKey: null });

    const result = await enrollBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should clean up keys if authentication fails', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.TouchID,
    });
    mockInstance.createKeys.mockResolvedValue({ publicKey: 'key' });
    mockInstance.createSignature.mockResolvedValue({ success: false });
    mockInstance.deleteKeys.mockResolvedValue({ keysDeleted: true });

    const result = await enrollBiometrics();

    expect(result.success).toBe(false);
    expect(mockInstance.deleteKeys).toHaveBeenCalled();
  });
});

describe('Biometrics - Disable', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = {
      isSensorAvailable: jest.fn(),
      createKeys: jest.fn(),
      deleteKeys: jest.fn(),
      biometricKeysExist: jest.fn(),
      createSignature: jest.fn(),
    };
    (MockedBiometrics as any).mockReturnValue(mockInstance);
  });

  it('should disable biometrics successfully', async () => {
    mockInstance.deleteKeys.mockResolvedValue({ keysDeleted: true });

    const result = await disableBiometrics();

    expect(result.success).toBe(true);
  });

  it('should handle disable failure', async () => {
    mockInstance.deleteKeys.mockResolvedValue({ keysDeleted: false });

    const result = await disableBiometrics();

    expect(result.success).toBe(false);
  });
});

describe('Biometrics - Enrollment Check', () => {
  let mockInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInstance = {
      isSensorAvailable: jest.fn(),
      createKeys: jest.fn(),
      deleteKeys: jest.fn(),
      biometricKeysExist: jest.fn(),
      createSignature: jest.fn(),
    };
    (MockedBiometrics as any).mockReturnValue(mockInstance);
  });

  it('should return true if enrolled', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.TouchID,
    });
    mockInstance.biometricKeysExist.mockResolvedValue({ keysExist: true });

    const result = await isBiometricsEnrolled();

    expect(result).toBe(true);
  });

  it('should return false if not enrolled', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: true,
      biometryType: BiometryTypes.TouchID,
    });
    mockInstance.biometricKeysExist.mockResolvedValue({ keysExist: false });

    const result = await isBiometricsEnrolled();

    expect(result).toBe(false);
  });

  it('should return false if not available', async () => {
    mockInstance.isSensorAvailable.mockResolvedValue({
      available: false,
    });

    const result = await isBiometricsEnrolled();

    expect(result).toBe(false);
  });
});
