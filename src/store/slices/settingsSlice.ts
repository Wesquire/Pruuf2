/**
 * Settings Slice
 * Manages app settings and preferences
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontSize = 'small' | 'medium' | 'large';

interface SettingsState {
  fontSize: FontSize;
  notificationsEnabled: boolean;
  remindersEnabled: boolean;
  biometricsEnabled: boolean;
  timezone: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  fontSize: 'medium',
  notificationsEnabled: true,
  remindersEnabled: true,
  biometricsEnabled: false,
  timezone: 'America/New_York',
  isLoading: false,
  error: null,
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async (_, {rejectWithValue}) => {
    try {
      const settingsJson = await AsyncStorage.getItem('app_settings');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
      return initialState;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: Partial<SettingsState>, {getState, rejectWithValue}) => {
    try {
      const state = getState() as {settings: SettingsState};
      const newSettings = {...state.settings, ...settings};
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      return newSettings;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateFontSize = createAsyncThunk(
  'settings/updateFontSize',
  async (fontSize: FontSize, {dispatch}) => {
    await dispatch(saveSettings({fontSize}));
    return fontSize;
  },
);

export const toggleNotifications = createAsyncThunk(
  'settings/toggleNotifications',
  async (enabled: boolean, {dispatch}) => {
    await dispatch(saveSettings({notificationsEnabled: enabled}));
    return enabled;
  },
);

export const toggleReminders = createAsyncThunk(
  'settings/toggleReminders',
  async (enabled: boolean, {dispatch}) => {
    await dispatch(saveSettings({remindersEnabled: enabled}));
    return enabled;
  },
);

export const toggleBiometrics = createAsyncThunk(
  'settings/toggleBiometrics',
  async (enabled: boolean, {dispatch}) => {
    await dispatch(saveSettings({biometricsEnabled: enabled}));
    return enabled;
  },
);

export const updateTimezone = createAsyncThunk(
  'settings/updateTimezone',
  async (timezone: string, {dispatch}) => {
    await dispatch(saveSettings({timezone}));
    return timezone;
  },
);

// Slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setFontSize: (state, action: PayloadAction<FontSize>) => {
      state.fontSize = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    setRemindersEnabled: (state, action: PayloadAction<boolean>) => {
      state.remindersEnabled = action.payload;
    },
    setBiometricsEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricsEnabled = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
  },
  extraReducers: builder => {
    // Load settings
    builder.addCase(loadSettings.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadSettings.fulfilled, (state, action) => {
      state.isLoading = false;
      Object.assign(state, action.payload);
    });
    builder.addCase(loadSettings.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Save settings
    builder.addCase(saveSettings.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(saveSettings.fulfilled, (state, action) => {
      state.isLoading = false;
      Object.assign(state, action.payload);
    });
    builder.addCase(saveSettings.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update font size
    builder.addCase(updateFontSize.fulfilled, (state, action) => {
      state.fontSize = action.payload;
    });

    // Toggle notifications
    builder.addCase(toggleNotifications.fulfilled, (state, action) => {
      state.notificationsEnabled = action.payload;
    });

    // Toggle reminders
    builder.addCase(toggleReminders.fulfilled, (state, action) => {
      state.remindersEnabled = action.payload;
    });

    // Toggle biometrics
    builder.addCase(toggleBiometrics.fulfilled, (state, action) => {
      state.biometricsEnabled = action.payload;
    });

    // Update timezone
    builder.addCase(updateTimezone.fulfilled, (state, action) => {
      state.timezone = action.payload;
    });
  },
});

export const {
  clearError,
  setFontSize,
  setNotificationsEnabled,
  setRemindersEnabled,
  setBiometricsEnabled,
  setTimezone,
} = settingsSlice.actions;
export default settingsSlice.reducer;
