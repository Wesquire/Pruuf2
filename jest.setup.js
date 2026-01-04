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

// Mock Expo Secure Store (replaces react-native-encrypted-storage)
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Expo Notifications (replaces @react-native-firebase/messaging)
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({status: 'granted'})),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({status: 'granted'})),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({data: 'ExponentPushToken[mock-token]'}),
  ),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({remove: jest.fn()})),
  addNotificationResponseReceivedListener: jest.fn(() => ({remove: jest.fn()})),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  setBadgeCountAsync: jest.fn(() => Promise.resolve()),
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
  AndroidNotificationPriority: {HIGH: 'high', DEFAULT: 'default', LOW: 'low'},
  AndroidImportance: {HIGH: 4, DEFAULT: 3, LOW: 2},
  SchedulableTriggerInputTypes: {DAILY: 'daily', DATE: 'date'},
}));

// Mock Expo Device
jest.mock('expo-device', () => ({
  isDevice: true,
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}));

// Mock Expo Local Authentication (replaces react-native-biometrics)
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])), // FINGERPRINT=1, FACIAL_RECOGNITION=2
  authenticateAsync: jest.fn(() => Promise.resolve({success: true})),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
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

// Mock Expo Haptics (replaces react-native-haptic-feedback)
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock Expo Vector Icons (replaces react-native-vector-icons)
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const mockIcon = (props) => React.createElement('Text', props, props.name || 'icon');
  return {
    Feather: mockIcon,
    MaterialIcons: mockIcon,
    Ionicons: mockIcon,
    FontAwesome: mockIcon,
    MaterialCommunityIcons: mockIcon,
  };
});

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
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');

  function ModalMock({children, visible = false}) {
    // Simply return children when visible, null when not
    // This avoids circular dependencies with React Native components
    if (!visible) {
      return null;
    }
    return React.createElement(React.Fragment, null, children);
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
