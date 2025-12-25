/**
 * Jest Setup
 * Configure test environment for React Native 0.78 + React 19
 */
/* eslint-env jest */

// Set React test environment flags for React 19
global.IS_REACT_ACT_ENVIRONMENT = true;
global.IS_REACT_NATIVE_TEST_ENVIRONMENT = true;

// React 19 concurrent rendering compatibility
// This enables legacy synchronous rendering for test-renderer
// Required for tests that use react-test-renderer.create() directly
const React = require('react');
if (React.unstable_enableSyncDefaultUpdates) {
  React.unstable_enableSyncDefaultUpdates();
}

import 'react-native-gesture-handler/jestSetup';

// Mock React Native modules
// Note: NativeAnimatedHelper mock removed for RN 0.78 compatibility

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock Encrypted Storage
jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase Analytics
jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    logEvent: jest.fn(() => Promise.resolve()),
    setUserProperty: jest.fn(() => Promise.resolve()),
    setUserId: jest.fn(() => Promise.resolve()),
    setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
    resetAnalyticsData: jest.fn(() => Promise.resolve()),
    setCurrentScreen: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock Firebase Messaging
jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    getToken: jest.fn(() => Promise.resolve('mock-fcm-token')),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    onTokenRefresh: jest.fn(),
  })),
  AuthorizationStatus: {
    AUTHORIZED: 1,
    DENIED: 0,
    NOT_DETERMINED: -1,
    PROVISIONAL: 2,
  },
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock react-native-push-notification (local notifications)
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotificationSchedule: jest.fn(),
  localNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(),
  getScheduledLocalNotifications: jest.fn((callback) => callback([])),
  cancelLocalNotification: jest.fn(),
  createChannel: jest.fn((channel, callback) => callback(true)),
  channelExists: jest.fn(),
  deleteChannel: jest.fn(),
  getChannels: jest.fn(),
  checkPermissions: jest.fn(),
  requestPermissions: jest.fn(),
  abandonPermissions: jest.fn(),
  setNotificationCategories: jest.fn(),
  setApplicationIconBadgeNumber: jest.fn(),
}));

// Mock @react-native-community/push-notification-ios
jest.mock('@react-native-community/push-notification-ios', () => ({
  requestPermissions: jest.fn(() =>
    Promise.resolve({alert: true, badge: true, sound: true}),
  ),
  checkPermissions: jest.fn((callback) =>
    callback({alert: 1, badge: 1, sound: 1}),
  ),
  setApplicationIconBadgeNumber: jest.fn(),
  getApplicationIconBadgeNumber: jest.fn(() => Promise.resolve(0)),
  addNotificationRequest: jest.fn(() => Promise.resolve()),
  getPendingNotificationRequests: jest.fn(() => Promise.resolve([])),
  removeAllPendingNotificationRequests: jest.fn(),
  removePendingNotificationRequests: jest.fn(),
  getDeliveredNotifications: jest.fn(() => Promise.resolve([])),
  removeAllDeliveredNotifications: jest.fn(),
  removeDeliveredNotifications: jest.fn(),
  setNotificationCategories: jest.fn(),
  FetchResult: {
    NewData: 'UIBackgroundFetchResultNewData',
    NoData: 'UIBackgroundFetchResultNoData',
    ResultFailed: 'UIBackgroundFetchResultFailed',
  },
}));

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

// Mock RevenueCat (used instead of Stripe)
jest.mock('react-native-purchases', () => ({
  configure: jest.fn(),
  getOfferings: jest.fn(() => Promise.resolve({current: null})),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(() => Promise.resolve({customerInfo: {}})),
  getCustomerInfo: jest.fn(() => Promise.resolve({entitlements: {active: {}}})),
  Purchases: {
    configure: jest.fn(),
  },
}));

jest.mock('react-native-purchases-ui', () => ({
  presentPaywall: jest.fn(),
}));

// Mock React Native Vector Icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

// Mock Reanimated 4.x
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock react-native-worklets (required by Reanimated 4.x)
jest.mock('react-native-worklets', () => ({
  createWorkletRuntime: jest.fn(),
  runOnJS: jest.fn((fn) => fn),
  runOnUI: jest.fn((fn) => fn),
  useWorklet: jest.fn((fn) => fn),
}));

// Mock react-native-screens (required for v4+ with Fabric)
jest.mock('react-native-screens', () => {
  const React = require('react');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    Screen: ({children}) => children,
    ScreenContainer: ({children}) => children,
    ScreenStack: ({children}) => children,
    ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
    ScreenStackHeaderSubview: 'ScreenStackHeaderSubview',
    ScreenStackHeaderBackButtonImage: 'ScreenStackHeaderBackButtonImage',
    ScreenStackHeaderRightView: 'ScreenStackHeaderRightView',
    ScreenStackHeaderLeftView: 'ScreenStackHeaderLeftView',
    ScreenStackHeaderCenterView: 'ScreenStackHeaderCenterView',
    ScreenStackHeaderSearchBarView: 'ScreenStackHeaderSearchBarView',
    SearchBar: 'SearchBar',
    NativeScreenContainer: ({children}) => children,
    NativeScreen: ({children}) => children,
    NativeScreenNavigationContainer: ({children}) => children,
    useTransitionProgress: () => ({progress: {value: 1}}),
    isSearchBarAvailableForCurrentPlatform: false,
  };
});

// Override Modal mock for React 19 + react-test-renderer compatibility
// Use a plain function component to avoid circular dependencies
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');

  function ModalMock({children, visible = false, onRequestClose, ...props}) {
    // Return a simple structure that can be tested
    // Using createElement with string type to avoid requiring View
    if (!visible) {
      return React.createElement('View', {
        testID: 'modal-hidden',
        visible: false,
        onRequestClose,
      });
    }
    return React.createElement(
      'View',
      {
        testID: 'modal-visible',
        visible: true,
        onRequestClose,
        ...props,
      },
      children,
    );
  }

  ModalMock.displayName = 'Modal';
  return ModalMock;
});

// Note: NativeAnimatedHelper mock removed for RN 0.78 compatibility

// Mock InteractionManager for VirtualizedLists (FlatList, SectionList)
jest.mock('react-native/Libraries/Interaction/InteractionManager', () => ({
  runAfterInteractions: jest.fn((callback) => {
    callback();
    return {cancel: jest.fn()};
  }),
  createInteractionHandle: jest.fn(),
  clearInteractionHandle: jest.fn(),
  setDeadline: jest.fn(),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
