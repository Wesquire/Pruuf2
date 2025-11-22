/**
 * Mock for @react-native-community/netinfo
 */

const netInfo = {
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {},
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
  removeEventListener: jest.fn(),
};

export default netInfo;
