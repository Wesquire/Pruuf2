/**
 * Analytics Service
 * Wrapper around Firebase Analytics
 */

import analytics from '@react-native-firebase/analytics';

/**
 * Initialize analytics service
 */
export const initializeAnalytics = async (): Promise<void> => {
  try {
    // Enable analytics collection
    await analytics().setAnalyticsCollectionEnabled(true);
    console.log('Analytics initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize analytics:', error);
  }
};

/**
 * Analytics service interface
 */
interface AnalyticsService {
  logEvent: (eventName: string, parameters?: Record<string, any>) => Promise<void>;
  setUserProperty: (name: string, value: string | number | boolean) => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
}

/**
 * Analytics service singleton
 */
export const analyticsService: AnalyticsService = {
  /**
   * Log an event
   */
  async logEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
    try {
      await analytics().logEvent(eventName, parameters);
    } catch (error) {
      console.warn('Failed to log event:', error);
    }
  },

  /**
   * Set a user property
   */
  async setUserProperty(name: string, value: string | number | boolean): Promise<void> {
    try {
      await analytics().setUserProperty(name, String(value));
    } catch (error) {
      console.warn('Failed to set user property:', error);
    }
  },

  /**
   * Set user ID
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.warn('Failed to set user ID:', error);
    }
  },
};
