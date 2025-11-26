/**
 * Mock for react-native-biometrics
 */

export const BiometryTypes = {
  FaceID: 'FaceID',
  TouchID: 'TouchID',
  Biometrics: 'Biometrics',
};

const mockInstance = {
  isSensorAvailable: jest.fn(() => Promise.resolve({ available: true, biometryType: 'TouchID' })),
  createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mock-public-key' })),
  deleteKeys: jest.fn(() => Promise.resolve({ keysDeleted: true })),
  biometricKeysExist: jest.fn(() => Promise.resolve({ keysExist: false })),
  createSignature: jest.fn(() => Promise.resolve({ success: true, signature: 'mock-signature' })),
};

export default jest.fn(() => mockInstance);
