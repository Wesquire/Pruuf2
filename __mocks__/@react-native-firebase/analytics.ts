/**
 * Mock for @react-native-firebase/analytics
 */

const mockAnalytics = {
  logEvent: jest.fn(() => Promise.resolve()),
  setUserProperty: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
  setCurrentScreen: jest.fn(() => Promise.resolve()),
};

export default jest.fn(() => mockAnalytics);
