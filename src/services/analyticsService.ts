/**
 * Analytics Service
 * Stub implementation - Firebase Analytics removed for Expo migration
 * Will be replaced with Expo Analytics or similar in Phase 6
 */

/**
 * Initialize analytics service
 */
export const initializeAnalytics = async (): Promise<void> => {
  // Stub - Firebase Analytics removed
  console.log('Analytics: Firebase removed, awaiting Expo implementation');
};

/**
 * Analytics service interface
 */
interface AnalyticsService {
  logEvent: (
    eventName: string,
    parameters?: Record<string, any>,
  ) => Promise<void>;
  setUserProperty: (
    name: string,
    value: string | number | boolean,
  ) => Promise<void>;
  setUserId: (userId: string) => Promise<void>;
}

/**
 * Analytics service singleton (stub)
 */
export const analyticsService: AnalyticsService = {
  /**
   * Log an event (stub)
   */
  async logEvent(
    eventName: string,
    _parameters?: Record<string, any>,
  ): Promise<void> {
    // Stub - Firebase Analytics removed
    console.log('Analytics stub: logEvent', eventName);
  },

  /**
   * Set a user property (stub)
   */
  async setUserProperty(
    name: string,
    value: string | number | boolean,
  ): Promise<void> {
    // Stub - Firebase Analytics removed
    console.log('Analytics stub: setUserProperty', name, value);
  },

  /**
   * Set user ID (stub)
   */
  async setUserId(userId: string): Promise<void> {
    // Stub - Firebase Analytics removed
    console.log('Analytics stub: setUserId', userId);
  },
};
