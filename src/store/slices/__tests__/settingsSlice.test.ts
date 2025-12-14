/**
 * Settings Slice Tests
 */

import settingsReducer, {
  loadSettings,
  saveSettings,
  updateFontSize,
  toggleNotifications,
  toggleReminders,
  toggleBiometrics,
  updateTimezone,
  clearError,
  setFontSize,
  setNotificationsEnabled,
} from '../settingsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('settingsSlice', () => {
  const initialState = {
    fontSize: 'medium' as const,
    notificationsEnabled: true,
    remindersEnabled: true,
    biometricsEnabled: false,
    timezone: 'America/New_York',
    isLoading: false,
    error: null,
  };

  describe('reducers', () => {
    it('should handle clearError', () => {
      const state = {...initialState, error: 'Test error'};
      expect(settingsReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle setFontSize', () => {
      expect(settingsReducer(initialState, setFontSize('large'))).toEqual({
        ...initialState,
        fontSize: 'large',
      });
    });

    it('should handle setNotificationsEnabled', () => {
      expect(
        settingsReducer(initialState, setNotificationsEnabled(false)),
      ).toEqual({
        ...initialState,
        notificationsEnabled: false,
      });
    });
  });

  describe('loadSettings', () => {
    it('should load settings on fulfilled', () => {
      const loadedSettings = {
        fontSize: 'large' as const,
        notificationsEnabled: false,
        remindersEnabled: false,
        biometricsEnabled: true,
        timezone: 'America/Los_Angeles',
        isLoading: false,
        error: null,
      };

      const action = {
        type: loadSettings.fulfilled.type,
        payload: loadedSettings,
      };
      const result = settingsReducer(initialState, action);

      expect(result.fontSize).toBe('large');
      expect(result.notificationsEnabled).toBe(false);
      expect(result.timezone).toBe('America/Los_Angeles');
    });

    it('should set error on rejected', () => {
      const action = {
        type: loadSettings.rejected.type,
        payload: 'Error loading',
      };
      expect(settingsReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        error: 'Error loading',
      });
    });
  });

  describe('saveSettings', () => {
    it('should save settings on fulfilled', () => {
      const newSettings = {
        ...initialState,
        fontSize: 'small' as const,
      };

      const action = {type: saveSettings.fulfilled.type, payload: newSettings};
      const result = settingsReducer(initialState, action);

      expect(result.fontSize).toBe('small');
    });
  });

  describe('updateFontSize', () => {
    it('should update font size on fulfilled', () => {
      const action = {
        type: updateFontSize.fulfilled.type,
        payload: 'large' as const,
      };
      expect(settingsReducer(initialState, action)).toEqual({
        ...initialState,
        fontSize: 'large',
      });
    });
  });

  describe('toggleNotifications', () => {
    it('should toggle notifications on fulfilled', () => {
      const action = {type: toggleNotifications.fulfilled.type, payload: false};
      expect(settingsReducer(initialState, action)).toEqual({
        ...initialState,
        notificationsEnabled: false,
      });
    });
  });

  describe('toggleReminders', () => {
    it('should toggle reminders on fulfilled', () => {
      const action = {type: toggleReminders.fulfilled.type, payload: false};
      expect(settingsReducer(initialState, action)).toEqual({
        ...initialState,
        remindersEnabled: false,
      });
    });
  });

  describe('toggleBiometrics', () => {
    it('should toggle biometrics on fulfilled', () => {
      const action = {type: toggleBiometrics.fulfilled.type, payload: true};
      expect(settingsReducer(initialState, action)).toEqual({
        ...initialState,
        biometricsEnabled: true,
      });
    });
  });

  describe('updateTimezone', () => {
    it('should update timezone on fulfilled', () => {
      const action = {
        type: updateTimezone.fulfilled.type,
        payload: 'America/Chicago',
      };
      expect(settingsReducer(initialState, action)).toEqual({
        ...initialState,
        timezone: 'America/Chicago',
      });
    });
  });
});
