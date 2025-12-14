/**
 * Analytics Tests
 * Item 35: Add Analytics Events Throughout App (MEDIUM)
 */

import {
  trackEvent,
  trackScreenView,
  trackError,
  trackPerformance,
  setUserProperty,
  setUserId,
  clearUserData,
  trackAppLaunch,
  trackSessionStart,
  trackSessionEnd,
  createTimedEvent,
  trackEvents,
} from '../utils/analytics';
import {analyticsService} from '../services/analyticsService';

// Mock analytics service
jest.mock('../services/analyticsService');

const mockAnalyticsService = analyticsService as jest.Mocked<
  typeof analyticsService
>;

describe('Analytics - Track Event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
  });

  it('should track event with parameters', async () => {
    await trackEvent('action_login_success' as any, {
      user_id: '123',
      screen_name: 'login',
    });

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'action_login_success',
      expect.objectContaining({
        user_id: '123',
        screen_name: 'login',
        timestamp: expect.any(Number),
      }),
    );
  });

  it('should add timestamp if not provided', async () => {
    await trackEvent('action_logout' as any);

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'action_logout',
      expect.objectContaining({
        timestamp: expect.any(Number),
      }),
    );
  });

  it('should handle tracking errors gracefully', async () => {
    mockAnalyticsService.logEvent.mockRejectedValue(new Error('Network error'));

    // Should not throw
    await expect(trackEvent('action_test' as any)).resolves.toBeUndefined();
  });
});

describe('Analytics - Screen View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
  });

  it('should track screen view with name', async () => {
    await trackScreenView('HomeScreen');

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'screen_view',
      expect.objectContaining({
        screen_name: 'HomeScreen',
      }),
    );
  });

  it('should track screen view with previous screen', async () => {
    await trackScreenView('SettingsScreen', 'HomeScreen');

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'screen_view',
      expect.objectContaining({
        screen_name: 'SettingsScreen',
        previous_screen: 'HomeScreen',
      }),
    );
  });

  it('should include additional parameters', async () => {
    await trackScreenView('ProfileScreen', 'HomeScreen', {
      user_id: '456',
    });

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'screen_view',
      expect.objectContaining({
        screen_name: 'ProfileScreen',
        previous_screen: 'HomeScreen',
        user_id: '456',
      }),
    );
  });
});

describe('Analytics - Error Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
  });

  it('should track Error object', async () => {
    const error = new Error('Test error');

    await trackError(error, 'LoginScreen');

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'error_unknown',
      expect.objectContaining({
        error_message: 'Test error',
        error_stack: expect.stringContaining('Error'),
        action_source: 'LoginScreen',
      }),
    );
  });

  it('should track string error', async () => {
    await trackError('Something went wrong', 'CheckInScreen');

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'error_unknown',
      expect.objectContaining({
        error_message: 'Something went wrong',
        action_source: 'CheckInScreen',
      }),
    );
  });

  it('should include additional parameters', async () => {
    await trackError('API failed', 'ApiCall', {
      error_code: '500',
    });

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'error_unknown',
      expect.objectContaining({
        error_message: 'API failed',
        action_source: 'ApiCall',
        error_code: '500',
      }),
    );
  });
});

describe('Analytics - Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
  });

  it('should track performance metric', async () => {
    await trackPerformance('screen_load', 1250);

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'performance_screen_load_time',
      expect.objectContaining({
        screen_name: 'screen_load',
        duration_ms: 1250,
      }),
    );
  });

  it('should include additional parameters', async () => {
    await trackPerformance('api_call', 350, {
      action_source: 'fetchData',
    });

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'performance_screen_load_time',
      expect.objectContaining({
        screen_name: 'api_call',
        duration_ms: 350,
        action_source: 'fetchData',
      }),
    );
  });
});

describe('Analytics - User Properties', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.setUserProperty = jest
      .fn()
      .mockResolvedValue(undefined);
  });

  it('should set user property', async () => {
    await setUserProperty('subscription_tier', 'premium');

    expect(mockAnalyticsService.setUserProperty).toHaveBeenCalledWith(
      'subscription_tier',
      'premium',
    );
  });

  it('should handle numeric property', async () => {
    await setUserProperty('age', 25);

    expect(mockAnalyticsService.setUserProperty).toHaveBeenCalledWith(
      'age',
      25,
    );
  });

  it('should handle boolean property', async () => {
    await setUserProperty('is_premium', true);

    expect(mockAnalyticsService.setUserProperty).toHaveBeenCalledWith(
      'is_premium',
      true,
    );
  });

  it('should handle errors gracefully', async () => {
    mockAnalyticsService.setUserProperty.mockRejectedValue(new Error('Failed'));

    await expect(setUserProperty('prop', 'value')).resolves.toBeUndefined();
  });
});

describe('Analytics - User ID', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.setUserId = jest.fn().mockResolvedValue(undefined);
  });

  it('should set user ID', async () => {
    await setUserId('user-123');

    expect(mockAnalyticsService.setUserId).toHaveBeenCalledWith('user-123');
  });

  it('should clear user data', async () => {
    await clearUserData();

    expect(mockAnalyticsService.setUserId).toHaveBeenCalledWith('');
  });
});

describe('Analytics - App Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
  });

  it('should track app launch', async () => {
    await trackAppLaunch(true);

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'engagement_app_opened',
      expect.objectContaining({
        is_first_launch: true,
      }),
    );
  });

  it('should track session start', async () => {
    await trackSessionStart();

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'engagement_session_started',
      expect.any(Object),
    );
  });

  it('should track session end with duration', async () => {
    await trackSessionEnd(120000);

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'engagement_session_ended',
      expect.objectContaining({
        duration_ms: 120000,
      }),
    );
  });
});

describe('Analytics - Timed Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track timed event with duration', async () => {
    const timedEvent = createTimedEvent('action_test' as any);

    jest.advanceTimersByTime(2000);

    await timedEvent.end();

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'action_test',
      expect.objectContaining({
        duration_ms: expect.any(Number),
      }),
    );
  });

  it('should include additional parameters', async () => {
    const timedEvent = createTimedEvent('action_load' as any);

    jest.advanceTimersByTime(500);

    await timedEvent.end({user_id: '789'});

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledWith(
      'action_load',
      expect.objectContaining({
        duration_ms: expect.any(Number),
        user_id: '789',
      }),
    );
  });
});

describe('Analytics - Batch Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsService.logEvent = jest.fn().mockResolvedValue(undefined);
  });

  it('should track multiple events', async () => {
    await trackEvents([
      {name: 'action_one' as any, params: {id: '1'}},
      {name: 'action_two' as any, params: {id: '2'}},
      {name: 'action_three' as any},
    ]);

    expect(mockAnalyticsService.logEvent).toHaveBeenCalledTimes(3);
  });

  it('should handle batch errors gracefully', async () => {
    mockAnalyticsService.logEvent.mockRejectedValue(new Error('Failed'));

    await expect(
      trackEvents([{name: 'action_test' as any}]),
    ).resolves.toBeUndefined();
  });
});

describe('Analytics - Event Constants', () => {
  it('should have screen events', () => {
    const {ScreenEvents} = require('../constants/analyticsEvents');

    expect(ScreenEvents.PHONE_ENTRY_SCREEN).toBe('screen_phone_entry');
    expect(ScreenEvents.MEMBER_DASHBOARD).toBe('screen_member_dashboard');
  });

  it('should have user action events', () => {
    const {UserActionEvents} = require('../constants/analyticsEvents');

    expect(UserActionEvents.PHONE_SUBMITTED).toBe('action_phone_submitted');
    expect(UserActionEvents.LOGIN_SUCCESS).toBe('action_login_success');
  });

  it('should have error events', () => {
    const {ErrorEvents} = require('../constants/analyticsEvents');

    expect(ErrorEvents.LOGIN_FAILED).toBe('error_login_failed');
    expect(ErrorEvents.API_REQUEST_FAILED).toBe('error_api_request_failed');
  });
});
