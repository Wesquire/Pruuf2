/**
 * Analytics Utilities
 * Item 35: Add Analytics Events Throughout App (MEDIUM)
 *
 * Handles sending analytics events to tracking service
 */

import {
  AnalyticsEventName,
  EventParameters,
} from '../constants/analyticsEvents';
import {analyticsService} from '../services/analyticsService';

/**
 * Track an analytics event
 */
export async function trackEvent(
  eventName: AnalyticsEventName,
  parameters?: EventParameters,
): Promise<void> {
  try {
    // Add timestamp if not provided
    const enrichedParameters: EventParameters = {
      ...parameters,
      timestamp: parameters?.timestamp || Date.now(),
    };

    // Send to analytics service
    await analyticsService.logEvent(eventName, enrichedParameters);
  } catch (error) {
    // Silently fail - don't break app if analytics fails
    console.warn('Analytics tracking failed:', error);
  }
}

/**
 * Track screen view event
 */
export async function trackScreenView(
  screenName: string,
  previousScreen?: string,
  additionalParams?: EventParameters,
): Promise<void> {
  await trackEvent('screen_view' as AnalyticsEventName, {
    screen_name: screenName,
    previous_screen: previousScreen,
    ...additionalParams,
  });
}

/**
 * Track error event
 */
export async function trackError(
  error: Error | string,
  context?: string,
  additionalParams?: EventParameters,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  await trackEvent('error_unknown' as AnalyticsEventName, {
    error_message: errorMessage,
    error_stack: errorStack,
    action_source: context,
    ...additionalParams,
  });
}

/**
 * Track performance metric
 */
export async function trackPerformance(
  metricName: string,
  durationMs: number,
  additionalParams?: EventParameters,
): Promise<void> {
  await trackEvent('performance_screen_load_time' as AnalyticsEventName, {
    screen_name: metricName,
    duration_ms: durationMs,
    ...additionalParams,
  });
}

/**
 * Track user property
 */
export async function setUserProperty(
  propertyName: string,
  value: string | number | boolean,
): Promise<void> {
  try {
    await analyticsService.setUserProperty(propertyName, value);
  } catch (error) {
    console.warn('Failed to set user property:', error);
  }
}

/**
 * Set user ID for analytics
 */
export async function setUserId(userId: string): Promise<void> {
  try {
    await analyticsService.setUserId(userId);
  } catch (error) {
    console.warn('Failed to set user ID:', error);
  }
}

/**
 * Clear user data (on logout)
 */
export async function clearUserData(): Promise<void> {
  try {
    await analyticsService.setUserId('');
  } catch (error) {
    console.warn('Failed to clear user data:', error);
  }
}

/**
 * Track app launch
 */
export async function trackAppLaunch(isFirstLaunch: boolean): Promise<void> {
  await trackEvent('engagement_app_opened' as AnalyticsEventName, {
    is_first_launch: isFirstLaunch,
  });
}

/**
 * Track session start
 */
export async function trackSessionStart(): Promise<void> {
  await trackEvent('engagement_session_started' as AnalyticsEventName);
}

/**
 * Track session end
 */
export async function trackSessionEnd(durationMs: number): Promise<void> {
  await trackEvent('engagement_session_ended' as AnalyticsEventName, {
    duration_ms: durationMs,
  });
}

/**
 * Create a timed event tracker
 */
export function createTimedEvent(eventName: AnalyticsEventName) {
  const startTime = Date.now();

  return {
    end: async (additionalParams?: EventParameters) => {
      const duration = Date.now() - startTime;
      await trackEvent(eventName, {
        duration_ms: duration,
        ...additionalParams,
      });
    },
  };
}

/**
 * Batch track multiple events
 */
export async function trackEvents(
  events: Array<{name: AnalyticsEventName; params?: EventParameters}>,
): Promise<void> {
  try {
    await Promise.all(
      events.map(event => trackEvent(event.name, event.params)),
    );
  } catch (error) {
    console.warn('Batch event tracking failed:', error);
  }
}
