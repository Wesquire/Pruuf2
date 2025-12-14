/**
 * Mock for react-native-push-notification
 */

export enum Importance {
  DEFAULT = 3,
  HIGH = 4,
  LOW = 2,
  MIN = 1,
  NONE = 0,
}

const PushNotification = {
  configure: jest.fn(),
  localNotification: jest.fn(),
  localNotificationSchedule: jest.fn(),
  requestPermissions: jest.fn().mockResolvedValue({
    alert: true,
    badge: true,
    sound: true,
  }),
  checkPermissions: jest.fn((callback: (permissions: any) => void) => {
    callback({
      alert: true,
      badge: true,
      sound: true,
    });
  }),
  cancelLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  removeAllDeliveredNotifications: jest.fn(),
  getDeliveredNotifications: jest.fn(
    (callback: (notifications: any[]) => void) => {
      callback([]);
    },
  ),
  getScheduledLocalNotifications: jest.fn(
    (callback: (notifications: any[]) => void) => {
      callback([]);
    },
  ),
  setApplicationIconBadgeNumber: jest.fn(),
  getApplicationIconBadgeNumber: jest.fn(
    (callback: (badgeNumber: number) => void) => {
      callback(0);
    },
  ),
  popInitialNotification: jest.fn((callback: (notification: any) => void) => {
    callback(null);
  }),
  abandonPermissions: jest.fn(),
  registerNotificationActions: jest.fn(),
  clearAllNotifications: jest.fn(),
  removeDeliveredNotifications: jest.fn(),
  invokeApp: jest.fn(),
  getChannels: jest.fn((callback: (channels: any[]) => void) => {
    callback([]);
  }),
  channelExists: jest.fn(
    (channelId: string, callback: (exists: boolean) => void) => {
      callback(false);
    },
  ),
  createChannel: jest.fn(),
  deleteChannel: jest.fn(),
};

export default PushNotification;
