/**
 * useAnalytics Hook
 * Item 35: Add Analytics Events Throughout App (MEDIUM)
 *
 * React hook for tracking analytics events
 */

import {useEffect, useCallback, useRef} from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  trackEvent,
  trackScreenView,
  trackError,
  trackPerformance,
  createTimedEvent,
} from '../utils/analytics';
import {
  AnalyticsEventName,
  EventParameters,
} from '../constants/analyticsEvents';

export interface UseAnalyticsReturn {
  track: (
    eventName: AnalyticsEventName,
    params?: EventParameters,
  ) => Promise<void>;
  trackScreen: (screenName?: string, params?: EventParameters) => Promise<void>;
  trackError: (
    error: Error | string,
    context?: string,
    params?: EventParameters,
  ) => Promise<void>;
  trackPerformance: (
    metricName: string,
    durationMs: number,
    params?: EventParameters,
  ) => Promise<void>;
  startTimed: (eventName: AnalyticsEventName) => {
    end: (params?: EventParameters) => Promise<void>;
  };
}

/**
 * Hook for tracking analytics events
 */
export function useAnalytics(
  options: {trackScreenView?: boolean} = {},
): UseAnalyticsReturn {
  const {trackScreenView: autoTrackScreenView = true} = options;
  const navigation = useNavigation();
  const route = useRoute();
  const previousScreenRef = useRef<string | undefined>();

  /**
   * Track generic event
   */
  const track = useCallback(
    async (
      eventName: AnalyticsEventName,
      params?: EventParameters,
    ): Promise<void> => {
      await trackEvent(eventName, {
        screen_name: route.name,
        ...params,
      });
    },
    [route.name],
  );

  /**
   * Track screen view
   */
  const trackScreen = useCallback(
    async (screenName?: string, params?: EventParameters): Promise<void> => {
      const name = screenName || route.name;
      await trackScreenView(name, previousScreenRef.current, {
        ...params,
      });
      previousScreenRef.current = name;
    },
    [route.name],
  );

  /**
   * Track error with context
   */
  const trackErrorEvent = useCallback(
    async (
      error: Error | string,
      context?: string,
      params?: EventParameters,
    ): Promise<void> => {
      await trackError(error, context || route.name, {
        screen_name: route.name,
        ...params,
      });
    },
    [route.name],
  );

  /**
   * Track performance metric
   */
  const trackPerformanceMetric = useCallback(
    async (
      metricName: string,
      durationMs: number,
      params?: EventParameters,
    ): Promise<void> => {
      await trackPerformance(metricName, durationMs, {
        screen_name: route.name,
        ...params,
      });
    },
    [route.name],
  );

  /**
   * Create timed event
   */
  const startTimed = useCallback(
    (eventName: AnalyticsEventName) => {
      const timedEvent = createTimedEvent(eventName);

      return {
        end: async (params?: EventParameters) => {
          await timedEvent.end({
            screen_name: route.name,
            ...params,
          });
        },
      };
    },
    [route.name],
  );

  /**
   * Auto-track screen view on mount
   */
  useEffect(() => {
    if (autoTrackScreenView) {
      trackScreen();
    }
  }, [autoTrackScreenView, trackScreen]);

  return {
    track,
    trackScreen,
    trackError: trackErrorEvent,
    trackPerformance: trackPerformanceMetric,
    startTimed,
  };
}

/**
 * Hook for tracking screen load time
 */
export function useScreenLoadTime(screenName?: string): void {
  const {trackPerformance} = useAnalytics({trackScreenView: false});
  const route = useRoute();
  const loadStartTime = useRef(Date.now());

  useEffect(() => {
    const loadTime = Date.now() - loadStartTime.current;
    const name = screenName || route.name;

    trackPerformance(name, loadTime);
  }, [screenName, route.name, trackPerformance]);
}

/**
 * Hook for tracking component render time
 */
export function useRenderTime(componentName: string): void {
  const {trackPerformance} = useAnalytics({trackScreenView: false});
  const renderStartTime = useRef(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;

    if (renderTime > 1000) {
      // Only track slow renders (>1s)
      trackPerformance(`${componentName}_render`, renderTime);
    }
  }, [componentName, trackPerformance]);
}
