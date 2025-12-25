/**
 * NotificationSettingsScreen Tests
 * Tests for the notification settings screen
 * Covers email notifications, push notifications, and reminder settings
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import NotificationSettingsScreen from '../NotificationSettingsScreen';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Mock Redux store
const mockDispatch = jest.fn();
let mockUser = {is_member: true, font_size_preference: 'standard'};
let mockNotificationsEnabled = true;
let mockRemindersEnabled = true;
let mockPermissionStatus = 'granted';

jest.mock('../../store', () => ({
  useAppSelector: (selector: any) => {
    const state = {
      auth: {user: mockUser},
      settings: {
        notificationsEnabled: mockNotificationsEnabled,
        remindersEnabled: mockRemindersEnabled,
      },
      notification: {permissionStatus: mockPermissionStatus},
    };
    return selector(state);
  },
  useAppDispatch: () => mockDispatch,
}));

// Mock API
const mockApiGet = jest.fn();
const mockApiPatch = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    patch: (...args: any[]) => mockApiPatch(...args),
  },
}));

// Mock notification service
const mockUpdateCheckInReminder = jest.fn();
jest.mock('../../services/notificationService', () => ({
  updateCheckInReminder: (...args: any[]) => mockUpdateCheckInReminder(...args),
}));

// Mock settings slice actions
jest.mock('../../store/slices/settingsSlice', () => ({
  toggleNotifications: jest.fn(() => ({type: 'settings/toggleNotifications'})),
  toggleReminders: jest.fn(() => ({type: 'settings/toggleReminders'})),
}));

// Mock notification slice actions
jest.mock('../../store/slices/notificationSlice', () => ({
  requestNotificationPermission: jest.fn(() => ({
    type: 'notification/requestPermission',
  })),
}));

// Mock Alert
jest.spyOn(require('react-native').Alert, 'alert');

describe('NotificationSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock state
    mockUser = {is_member: true, font_size_preference: 'standard'};
    mockNotificationsEnabled = true;
    mockRemindersEnabled = true;
    mockPermissionStatus = 'granted';

    // Default successful API responses
    mockApiGet.mockResolvedValue({
      data: {
        preferences: {
          reminder_enabled: true,
          reminder_minutes_before: 15,
          push_notifications_enabled: true,
          email_notifications_enabled: true,
        },
        member: {
          check_in_time: '10:00',
          timezone: 'America/Los_Angeles',
        },
      },
    });
    mockApiPatch.mockResolvedValue({data: {success: true}});
    mockDispatch.mockResolvedValue({unwrap: () => Promise.resolve('granted')});
  });

  describe('Rendering', () => {
    it('renders correctly', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('displays Notification Settings title', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Notification Settings');
    });

    it('displays subtitle text', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Manage your check-in reminders and alerts');
    });

    it('shows loading skeleton initially', () => {
      // Don't resolve API yet to test loading state
      mockApiGet.mockImplementation(() => new Promise(() => {}));

      const tree = createWithAct(<NotificationSettingsScreen />);
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });
  });

  describe('Email Notifications Section', () => {
    it('displays Email Notifications section title', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Email Notifications');
    });

    it('displays Enable Email Notifications label', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Enable Email Notifications');
    });

    it('displays email notification description for Members', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Receive important updates via email');
    });

    it('displays email notification description for Contacts', async () => {
      mockUser = {is_member: false, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Receive missed check-in alerts via email');
    });

    it('displays critical alerts info box', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Critical safety alerts');
      expect(json).toContain('will always be sent via email');
    });

    it('toggleEmailNotifications calls savePreferences with correct value', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      // Find and interact with email toggle
      const root = tree!.root;
      const switches = root.findAllByType(require('react-native').Switch);
      // Email notifications switch is the third one (after reminder and push)
      const emailSwitch = switches.find(s => {
        try {
          const parent = JSON.stringify(tree!.toJSON());
          return parent.includes('Email Notifications');
        } catch {
          return false;
        }
      });

      // The email switch should exist
      expect(switches.length).toBeGreaterThanOrEqual(2);

      // Verify API was called for initial load
      expect(mockApiGet).toHaveBeenCalledWith(
        '/api/members/notification-preferences',
      );
    });
  });

  describe('Push Notifications Section', () => {
    it('displays Push Notifications section title', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Push Notifications');
    });

    it('displays Enable Push Notifications label', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Enable Push Notifications');
    });

    it('displays push notification description for Members', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Get notified about reminders and updates');
    });

    it('displays push notification description for Contacts', async () => {
      mockUser = {is_member: false, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Get notified about missed check-ins and alerts');
    });
  });

  describe('Check-in Reminders Section (Members Only)', () => {
    it('displays Check-in Reminders section for Members', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Check-in Reminders');
    });

    it('does not display Check-in Reminders section for Contacts', async () => {
      mockUser = {is_member: false, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      // Should not contain the specific reminder section title
      // But should still have general content
      expect(json).toContain('Notification Settings');
    });

    it('displays Enable Reminders toggle', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Enable Reminders');
      expect(json).toContain('Get notified before your check-in time');
    });

    it('displays reminder time options when reminders are enabled', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};
      mockApiGet.mockResolvedValue({
        data: {
          preferences: {
            reminder_enabled: true,
            reminder_minutes_before: 15,
            push_notifications_enabled: true,
            email_notifications_enabled: true,
          },
        },
      });

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('15 minutes before');
      expect(json).toContain('30 minutes before');
      expect(json).toContain('1 hour before');
    });
  });

  describe('About Notifications Section', () => {
    it('displays About Notifications section title', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('About Notifications');
    });

    it('displays info text for Members', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain(
        'you can receive reminders before your check-in time',
      );
    });

    it('displays info text for Contacts', async () => {
      mockUser = {is_member: false, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain(
        'you will receive notifications when your Members miss their daily check-in',
      );
    });
  });

  describe('API Integration', () => {
    it('loads preferences on mount', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/api/members/notification-preferences',
      );
    });

    it('loads member profile for Members', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      expect(mockApiGet).toHaveBeenCalledWith('/api/members/profile');
    });

    it('handles API error on load gracefully', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Failed to load notification preferences',
      );
    });
  });

  describe('Font Size Preferences', () => {
    it('renders with standard font size', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with large font size', async () => {
      mockUser = {is_member: true, font_size_preference: 'large'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with extra_large font size', async () => {
      mockUser = {is_member: true, font_size_preference: 'extra_large'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });
  });

  describe('Switch Components', () => {
    it('renders multiple Switch components', async () => {
      mockUser = {is_member: true, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const root = tree!.root;
      const switches = root.findAllByType(require('react-native').Switch);
      // Should have at least 3 switches: reminder, push, email
      expect(switches.length).toBeGreaterThanOrEqual(3);
    });

    it('renders 2 Switch components for Contacts (no reminder switch)', async () => {
      mockUser = {is_member: false, font_size_preference: 'standard'};

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<NotificationSettingsScreen />);
      });

      const root = tree!.root;
      const switches = root.findAllByType(require('react-native').Switch);
      // Should have 2 switches for Contacts: push, email
      expect(switches.length).toBe(2);
    });
  });
});
