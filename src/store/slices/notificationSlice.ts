/**
 * Notification Slice
 * Manages notification state and settings
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import messaging from '@react-native-firebase/messaging';
import {pushAPI} from '../../services/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fcmToken: string | null;
  permissionStatus: 'granted' | 'denied' | 'not_determined';
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  fcmToken: null,
  permissionStatus: 'not_determined',
  isLoading: false,
  error: null,
};

// Async thunks
export const requestNotificationPermission = createAsyncThunk(
  'notification/requestPermission',
  async (_, {rejectWithValue}) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled ? 'granted' : 'denied';
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const registerFCMToken = createAsyncThunk(
  'notification/registerFCMToken',
  async (_, {rejectWithValue}) => {
    try {
      const fcmToken = await messaging().getToken();

      // Register token with backend
      const platform = require('react-native').Platform.OS;
      const response = await pushAPI.registerToken(fcmToken, platform);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to register token');
      }

      return fcmToken;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, {rejectWithValue}) => {
    try {
      const response = (await pushAPI.getNotifications()) as any;
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to fetch notifications',
        );
      }
      return response.notifications || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, {rejectWithValue}) => {
    try {
      const response = await pushAPI.markAsRead(notificationId);
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to mark as read');
      }
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, {rejectWithValue}) => {
    try {
      const response = await pushAPI.markAllAsRead();
      if (!response.success) {
        return rejectWithValue(response.error || 'Failed to mark all as read');
      }
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId: string, {rejectWithValue}) => {
    try {
      const response = await pushAPI.deleteNotification(notificationId);
      if (!response.success) {
        return rejectWithValue(
          response.error || 'Failed to delete notification',
        );
      }
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    clearNotifications: state => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setPermissionStatus: (
      state,
      action: PayloadAction<'granted' | 'denied' | 'not_determined'>,
    ) => {
      state.permissionStatus = action.payload;
    },
  },
  extraReducers: builder => {
    // Request permission
    builder.addCase(requestNotificationPermission.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(
      requestNotificationPermission.fulfilled,
      (state, action) => {
        state.isLoading = false;
        state.permissionStatus = action.payload as 'granted' | 'denied';
      },
    );
    builder.addCase(requestNotificationPermission.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Register FCM token
    builder.addCase(registerFCMToken.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerFCMToken.fulfilled, (state, action) => {
      state.isLoading = false;
      state.fcmToken = action.payload;
    });
    builder.addCase(registerFCMToken.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch notifications
    builder.addCase(fetchNotifications.pending, state => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.isLoading = false;
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n: any) => !n.read).length;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Mark as read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const notification = state.notifications.find(
        n => n.id === action.payload,
      );
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // Mark all as read
    builder.addCase(markAllAsRead.fulfilled, state => {
      state.notifications.forEach(n => {
        n.read = true;
      });
      state.unreadCount = 0;
    });

    // Delete notification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    });
  },
});

export const {
  clearError,
  addNotification,
  clearNotifications,
  setPermissionStatus,
} = notificationSlice.actions;
export default notificationSlice.reducer;
