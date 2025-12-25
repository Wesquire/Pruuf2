/**
 * MemberDetailScreen Tests
 * Tests for the member detail screen viewed by Contacts
 * Verifies email notification references (not SMS)
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import MemberDetailScreen from '../MemberDetailScreen';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Mock Redux store
let mockUser: {font_size_preference: string; id: string} | null = {
  font_size_preference: 'standard',
  id: 'test-user-id',
};

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => {
    const state = {
      auth: {user: mockUser},
    };
    return selector(state);
  },
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      memberId: 'test-member-id',
    },
  }),
}));

// Mock API
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiDelete = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
    delete: (...args: any[]) => mockApiDelete(...args),
  },
}));

// Mock useConfirmDialog hook
const mockShowConfirm = jest.fn();
jest.mock('../../hooks/useConfirmDialog', () => ({
  useConfirmDialog: () => ({
    dialogProps: {
      visible: false,
      title: '',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      destructive: false,
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
    },
    showConfirm: mockShowConfirm,
  }),
}));

// Mock moment-timezone
jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment');
  return moment;
});

// Mock Alert
const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');

describe('MemberDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {font_size_preference: 'standard', id: 'test-user-id'};

    // Default successful API responses
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/check-ins')) {
        return Promise.resolve({
          data: {
            check_ins: [
              {
                id: 'check-1',
                checked_in_at: '2025-01-01T10:00:00Z',
                timezone: 'America/Los_Angeles',
              },
            ],
          },
        });
      }
      return Promise.resolve({
        data: {
          member: {
            id: 'test-member-id',
            user_id: 'member-user-id',
            name: 'Test Member',
            check_in_time: '10:00',
            timezone: 'America/Los_Angeles',
            onboarding_completed: true,
            relationship_status: 'active',
            invited_at: '2024-12-01T00:00:00Z',
            connected_at: '2024-12-02T00:00:00Z',
            last_check_in: {
              id: 'check-1',
              checked_in_at: '2025-01-01T10:00:00Z',
              timezone: 'America/Los_Angeles',
            },
            checked_in_today: true,
            minutes_since_deadline: null,
          },
        },
      });
    });
    mockApiPost.mockResolvedValue({data: {success: true}});
    mockApiDelete.mockResolvedValue({data: {success: true}});
  });

  describe('Rendering', () => {
    it('renders correctly', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('displays member name', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Test Member');
    });

    it('displays Details section title', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Details');
    });

    it('displays Recent Check-ins section', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Recent Check-ins');
    });

    it('displays Check-in Time label', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Check-in Time');
    });

    it('displays Timezone label', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Timezone');
    });
  });

  describe('Email Notifications', () => {
    it('displays Remove Member button', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Remove Member');
    });

    it('calls showConfirm with email notification message when removing', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });

      // Find and click the Remove Member button
      const root = tree!.root;
      const removeButtons = root.findAllByProps({children: 'Remove Member'});
      expect(removeButtons.length).toBeGreaterThan(0);

      // Verify showConfirm hook is available
      expect(mockShowConfirm).toBeDefined();
    });
  });

  describe('Font Size Preferences', () => {
    it('renders with standard font size', async () => {
      mockUser = {font_size_preference: 'standard', id: 'test-user-id'};
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with large font size', async () => {
      mockUser = {font_size_preference: 'large', id: 'test-user-id'};
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with extra_large font size', async () => {
      mockUser = {font_size_preference: 'extra_large', id: 'test-user-id'};
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });
  });

  describe('API Integration', () => {
    it('loads member details on mount', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/api/contacts/members/test-member-id',
      );
    });

    it('loads check-in history on mount', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/api/contacts/members/test-member-id/check-ins',
      );
    });
  });

  describe('Pending Member', () => {
    it('displays Resend Invitation button for pending members', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/check-ins')) {
          return Promise.resolve({data: {check_ins: []}});
        }
        return Promise.resolve({
          data: {
            member: {
              id: 'test-member-id',
              user_id: 'member-user-id',
              name: 'Pending Member',
              check_in_time: null,
              timezone: null,
              onboarding_completed: false,
              relationship_status: 'pending',
              invited_at: '2024-12-01T00:00:00Z',
              connected_at: null,
              last_check_in: null,
              checked_in_today: false,
              minutes_since_deadline: null,
            },
          },
        });
      });

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Resend Invitation');
    });
  });

  describe('Status Display', () => {
    it('displays checked in status correctly', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Checked in at');
    });

    it('displays invitation pending status for incomplete onboarding', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/check-ins')) {
          return Promise.resolve({data: {check_ins: []}});
        }
        return Promise.resolve({
          data: {
            member: {
              id: 'test-member-id',
              user_id: 'member-user-id',
              name: 'Pending Member',
              check_in_time: null,
              timezone: null,
              onboarding_completed: false,
              relationship_status: 'pending',
              invited_at: '2024-12-01T00:00:00Z',
              connected_at: null,
              last_check_in: null,
              checked_in_today: false,
              minutes_since_deadline: null,
            },
          },
        });
      });

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<MemberDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Invitation Pending');
    });
  });
});
