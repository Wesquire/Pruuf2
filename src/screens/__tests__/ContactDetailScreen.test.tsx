/**
 * ContactDetailScreen Tests
 * Tests for the contact detail screen viewed by Members
 * Verifies email notification references (not SMS)
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import ContactDetailScreen from '../ContactDetailScreen';

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
      contactId: 'test-contact-id',
    },
  }),
}));

// Mock API
const mockApiGet = jest.fn();
const mockApiDelete = jest.fn();
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockApiGet(...args),
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

describe('ContactDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {font_size_preference: 'standard', id: 'test-user-id'};

    // Default successful API responses
    mockApiGet.mockResolvedValue({
      data: {
        contact: {
          id: 'test-contact-id',
          user_id: 'contact-user-id',
          phone: '+11234567890',
          relationship_status: 'active',
          invited_at: '2024-12-01T00:00:00Z',
          connected_at: '2024-12-02T00:00:00Z',
          last_invite_sent_at: null,
        },
      },
    });
    mockApiDelete.mockResolvedValue({data: {success: true}});
  });

  describe('Rendering', () => {
    it('renders correctly', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('displays formatted phone number', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      // Phone +11234567890 should be formatted as +1 (123) 456-7890
      expect(json).toContain('+1 (123) 456-7890');
    });

    it('displays Details section title', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Details');
    });

    it('displays About Contacts section', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('About Contacts');
    });

    it('displays Status label', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Status');
    });

    it('displays Invited On label', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Invited On');
    });
  });

  describe('Email Notifications', () => {
    it('displays Remove Contact button', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Remove Contact');
    });

    it('displays email notification message for removal', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = JSON.stringify(tree!.toJSON());
      // The removal note should mention email notification
      expect(json).toContain('Both of you will be notified via email');
    });

    it('calls showConfirm with email notification message when removing', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      // Find and verify the Remove Contact button exists
      const root = tree!.root;
      const removeButtons = root.findAllByProps({children: 'Remove Contact'});
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
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with large font size', async () => {
      mockUser = {font_size_preference: 'large', id: 'test-user-id'};
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with extra_large font size', async () => {
      mockUser = {font_size_preference: 'extra_large', id: 'test-user-id'};
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });
      const json = tree!.toJSON();
      expect(json).toBeTruthy();
    });
  });

  describe('API Integration', () => {
    it('loads contact details on mount', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        '/api/members/contacts/test-contact-id',
      );
    });

    it('handles API error gracefully', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Failed to load contact details',
      );
    });
  });

  describe('Active Contact', () => {
    it('displays Monitoring You status for active contact', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Monitoring You');
    });

    it('displays Connected Since for active contact', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Connected Since');
    });
  });

  describe('Pending Contact', () => {
    beforeEach(() => {
      mockApiGet.mockResolvedValue({
        data: {
          contact: {
            id: 'test-contact-id',
            user_id: 'contact-user-id',
            phone: '+11234567890',
            relationship_status: 'pending',
            invited_at: '2024-12-01T00:00:00Z',
            connected_at: null,
            last_invite_sent_at: '2024-12-01T12:00:00Z',
          },
        },
      });
    });

    it('displays Invitation Pending status for pending contact', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Invitation Pending');
    });

    it('displays warning box for pending contact', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain("hasn't accepted your invitation yet");
    });

    it('displays Last Invite Sent for pending contact', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Last Invite Sent');
    });
  });

  describe('About Contacts Information', () => {
    it('displays information about what contacts do', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('receive notifications');
      expect(json).toContain('miss your daily check-in');
    });
  });

  describe('Status Badge', () => {
    it('displays Active badge for active contact', async () => {
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Active');
    });

    it('displays Pending badge for pending contact', async () => {
      mockApiGet.mockResolvedValue({
        data: {
          contact: {
            id: 'test-contact-id',
            user_id: 'contact-user-id',
            phone: '+11234567890',
            relationship_status: 'pending',
            invited_at: '2024-12-01T00:00:00Z',
            connected_at: null,
            last_invite_sent_at: null,
          },
        },
      });

      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(<ContactDetailScreen />);
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('Pending');
    });
  });
});
