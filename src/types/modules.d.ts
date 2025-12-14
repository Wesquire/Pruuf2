/**
 * Type declarations for modules without TypeScript support
 */

// Expo Haptics
declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
  }

  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }

  export function impactAsync(style: ImpactFeedbackStyle): Promise<void>;
  export function notificationAsync(
    type: NotificationFeedbackType,
  ): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

// React Native Firebase Analytics
declare module '@react-native-firebase/analytics' {
  interface Analytics {
    logEvent(name: string, params?: Record<string, any>): Promise<void>;
    setUserProperty(name: string, value: string | null): Promise<void>;
    setUserId(id: string | null): Promise<void>;
    setAnalyticsCollectionEnabled(enabled: boolean): Promise<void>;
  }

  function analytics(): Analytics;
  export default analytics;
}

// React Native Push Notification
declare module 'react-native-push-notification' {
  export enum Importance {
    DEFAULT = 3,
    HIGH = 4,
    LOW = 2,
    MIN = 1,
    NONE = 0,
  }

  interface PushNotificationObject {
    id?: string;
    channelId?: string;
    title?: string;
    message: string;
    date?: Date;
    allowWhileIdle?: boolean;
    repeatType?: 'day' | 'week' | 'month' | 'year';
    playSound?: boolean;
    soundName?: string;
    importance?: string;
    vibrate?: boolean;
    vibration?: number;
  }

  interface ChannelObject {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    playSound?: boolean;
    soundName?: string;
    importance?: Importance;
    vibrate?: boolean;
  }

  interface ConfigureOptions {
    onNotification?: (notification: any) => void;
    onRegistrationError?: (error: Error) => void;
    senderID?: string;
    permissions?: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  const PushNotification: {
    configure(options: ConfigureOptions): void;
    localNotification(details: PushNotificationObject): void;
    localNotificationSchedule(details: PushNotificationObject): void;
    cancelLocalNotification(id: string): void;
    cancelAllLocalNotifications(): void;
    createChannel(
      channel: ChannelObject,
      callback: (created: boolean) => void,
    ): void;
    getScheduledLocalNotifications(
      callback: (notifications: any[]) => void,
    ): void;
    setApplicationIconBadgeNumber(number: number): void;
  };

  export default PushNotification;
}

// React Native Community Push Notification iOS
declare module '@react-native-community/push-notification-ios' {
  interface PushNotificationIOS {
    requestPermissions(permissions: {
      alert?: boolean;
      badge?: boolean;
      sound?: boolean;
    }): Promise<{alert: boolean; badge: boolean; sound: boolean}>;
    checkPermissions(): Promise<{alert: number; badge: number; sound: number}>;
    setApplicationIconBadgeNumber(number: number): void;
    FetchResult: {
      NoData: string;
      NewData: string;
      Failed: string;
    };
  }

  const PushNotificationIOS: PushNotificationIOS;
  export default PushNotificationIOS;
}
