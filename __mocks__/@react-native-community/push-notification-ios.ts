/**
 * Mock for @react-native-community/push-notification-ios
 */

const PushNotificationIOS = {
  presentLocalNotification: jest.fn(),
  scheduleLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(
    (callback: (notifications: any[]) => void) => {
      callback([]);
    },
  ),
  removeDeliveredNotifications: jest.fn(),
  setApplicationIconBadgeNumber: jest.fn(),
  getApplicationIconBadgeNumber: jest.fn(
    (callback: (badgeNumber: number) => void) => {
      callback(0);
    },
  ),
  requestPermissions: jest.fn().mockResolvedValue({
    alert: true,
    badge: true,
    sound: true,
  }),
  abandonPermissions: jest.fn(),
  checkPermissions: jest.fn((callback: (permissions: any) => void) => {
    callback({
      alert: 1,
      badge: 1,
      sound: 1,
    });
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  finish: jest.fn(),
  FetchResult: {
    NewData: 'UIBackgroundFetchResultNewData',
    NoData: 'UIBackgroundFetchResultNoData',
    Failed: 'UIBackgroundFetchResultFailed',
  },
};

export default PushNotificationIOS;
