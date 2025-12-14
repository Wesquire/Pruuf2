/**
 * Notification Slice Tests
 */

import notificationReducer, {
  requestNotificationPermission,
  registerFCMToken,
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearError,
  addNotification,
  clearNotifications,
  setPermissionStatus,
} from '../notificationSlice';

describe('notificationSlice', () => {
  const initialState = {
    notifications: [],
    unreadCount: 0,
    fcmToken: null,
    permissionStatus: 'not_determined' as const,
    isLoading: false,
    error: null,
  };

  describe('reducers', () => {
    it('should handle clearError', () => {
      const state = {...initialState, error: 'Test error'};
      expect(notificationReducer(state, clearError())).toEqual({
        ...state,
        error: null,
      });
    });

    it('should handle addNotification', () => {
      const notification = {
        id: '1',
        title: 'Test',
        body: 'Test notification',
        timestamp: '2024-01-01T09:00:00Z',
        read: false,
      };

      expect(
        notificationReducer(initialState, addNotification(notification)),
      ).toEqual({
        ...initialState,
        notifications: [notification],
        unreadCount: 1,
      });
    });

    it('should handle clearNotifications', () => {
      const state = {
        ...initialState,
        notifications: [
          {
            id: '1',
            title: 'Test',
            body: 'Test notification',
            timestamp: '2024-01-01T09:00:00Z',
            read: false,
          },
        ],
        unreadCount: 1,
      };

      expect(notificationReducer(state, clearNotifications())).toEqual({
        ...state,
        notifications: [],
        unreadCount: 0,
      });
    });

    it('should handle setPermissionStatus', () => {
      expect(
        notificationReducer(initialState, setPermissionStatus('granted')),
      ).toEqual({
        ...initialState,
        permissionStatus: 'granted',
      });
    });
  });

  describe('requestNotificationPermission', () => {
    it('should set permission status on fulfilled', () => {
      const action = {
        type: requestNotificationPermission.fulfilled.type,
        payload: 'granted',
      };
      expect(notificationReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        permissionStatus: 'granted',
      });
    });

    it('should set error on rejected', () => {
      const action = {
        type: requestNotificationPermission.rejected.type,
        payload: 'Error',
      };
      expect(notificationReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        error: 'Error',
      });
    });
  });

  describe('registerFCMToken', () => {
    it('should set FCM token on fulfilled', () => {
      const action = {
        type: registerFCMToken.fulfilled.type,
        payload: 'test-token-123',
      };
      expect(notificationReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        fcmToken: 'test-token-123',
      });
    });
  });

  describe('fetchNotifications', () => {
    it('should set notifications on fulfilled', () => {
      const notifications = [
        {
          id: '1',
          title: 'Test 1',
          body: 'Body 1',
          timestamp: '2024-01-01T09:00:00Z',
          read: false,
        },
        {
          id: '2',
          title: 'Test 2',
          body: 'Body 2',
          timestamp: '2024-01-01T10:00:00Z',
          read: true,
        },
      ];

      const action = {
        type: fetchNotifications.fulfilled.type,
        payload: notifications,
      };
      expect(notificationReducer(initialState, action)).toEqual({
        ...initialState,
        isLoading: false,
        notifications,
        unreadCount: 1,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const state = {
        ...initialState,
        notifications: [
          {
            id: '1',
            title: 'Test',
            body: 'Test notification',
            timestamp: '2024-01-01T09:00:00Z',
            read: false,
          },
        ],
        unreadCount: 1,
      };

      const action = {type: markAsRead.fulfilled.type, payload: '1'};
      const result = notificationReducer(state, action);

      expect(result.notifications[0].read).toBe(true);
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', () => {
      const state = {
        ...initialState,
        notifications: [
          {
            id: '1',
            title: 'Test 1',
            body: 'Body 1',
            timestamp: '2024-01-01T09:00:00Z',
            read: false,
          },
          {
            id: '2',
            title: 'Test 2',
            body: 'Body 2',
            timestamp: '2024-01-01T10:00:00Z',
            read: false,
          },
        ],
        unreadCount: 2,
      };

      const action = {type: markAllAsRead.fulfilled.type};
      const result = notificationReducer(state, action);

      expect(result.notifications.every(n => n.read)).toBe(true);
      expect(result.unreadCount).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', () => {
      const state = {
        ...initialState,
        notifications: [
          {
            id: '1',
            title: 'Test 1',
            body: 'Body 1',
            timestamp: '2024-01-01T09:00:00Z',
            read: false,
          },
          {
            id: '2',
            title: 'Test 2',
            body: 'Body 2',
            timestamp: '2024-01-01T10:00:00Z',
            read: true,
          },
        ],
        unreadCount: 1,
      };

      const action = {type: deleteNotification.fulfilled.type, payload: '1'};
      const result = notificationReducer(state, action);

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].id).toBe('2');
      expect(result.unreadCount).toBe(0);
    });
  });
});
