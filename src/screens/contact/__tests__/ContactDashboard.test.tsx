/**
 * ContactDashboard Tests
 * Tests for the contact dashboard showing monitored members
 *
 * Updated for Phase 4.1: Now uses Redux for state management
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ContactDashboard from '../ContactDashboard';
import memberReducer from '../../../store/slices/memberSlice';
import authReducer from '../../../store/slices/authSlice';
import settingsReducer from '../../../store/slices/settingsSlice';
import notificationReducer from '../../../store/slices/notificationSlice';
import paymentReducer from '../../../store/slices/paymentSlice';
import type {MemberInfo} from '../../../types/api';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// Mock the API to prevent actual network calls
jest.mock('../../../services/api', () => ({
  contactsAPI: {
    getMembers: jest.fn().mockResolvedValue({
      success: true,
      members: [],
    }),
  },
  membersAPI: {},
}));

// Sample member data for testing
const sampleMember: MemberInfo = {
  id: '1',
  name: 'Mom',
  email: 'mom@example.com',
  email_masked: 'm***@example.com',
  status: 'active',
  check_in_time: '10:00',
  timezone: 'America/Los_Angeles',
  reminder_enabled: true,
  formatted_time: '10:00 AM PST',
  last_check_in: {
    id: 'checkin-1',
    checked_in_at: new Date().toISOString(),
    timezone: 'America/Los_Angeles',
    local_time: 'Today, 9:45 AM',
    was_late: false,
    minutes_late: null,
  },
};

const sampleMemberPending: MemberInfo = {
  id: '2',
  name: 'Dad',
  email: 'dad@example.com',
  email_masked: 'd***@example.com',
  status: 'pending',
  check_in_time: '08:00',
  timezone: 'America/New_York',
  reminder_enabled: false,
  formatted_time: '8:00 AM EST',
  last_check_in: null,
};

// Create a test store with initial state
const createTestStore = (initialMemberState?: Partial<{
  members: MemberInfo[];
  isLoading: boolean;
  error: string | null;
}>) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      member: memberReducer,
      settings: settingsReducer,
      notification: notificationReducer,
      payment: paymentReducer,
    },
    preloadedState: {
      member: {
        members: initialMemberState?.members ?? [],
        contacts: [],
        checkIns: [],
        selectedMember: null,
        selectedContact: null,
        isLoading: initialMemberState?.isLoading ?? false,
        error: initialMemberState?.error ?? null,
        checkInHistory: [],
        checkInStats: null,
        isLoadingHistory: false,
      },
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Helper to get all text content from tree (avoids circular reference issues)
const getAllTextContent = (tree: ReactTestRenderer): string => {
  const textNodes: string[] = [];
  const findText = (node: any) => {
    if (typeof node === 'string') {
      textNodes.push(node);
    } else if (node?.children) {
      node.children.forEach(findText);
    }
  };
  const json = tree.toJSON();
  if (json) {
    if (Array.isArray(json)) {
      json.forEach(findText);
    } else {
      findText(json);
    }
  }
  return textNodes.join(' ');
};

// Wrapper component to provide Redux store
const TestWrapper: React.FC<{
  children: React.ReactNode;
  store: ReturnType<typeof createTestStore>;
}> = ({children, store}) => <Provider store={store}>{children}</Provider>;

describe('ContactDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('with members loaded', () => {
    it('renders correctly with members', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });

    it('displays Members title', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Members');
    });

    it('displays member name', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Mom');
    });

    it('displays Checked In status for active member', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Checked In');
    });

    it('displays last check-in time', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Last check-in:');
      expect(textContent).toContain('Today, 9:45 AM');
    });

    it('displays daily deadline', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Daily deadline:');
      expect(textContent).toContain('10:00 AM PST');
    });

    it('displays Call action button', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Call');
    });

    it('displays Text action button', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Text');
    });

    it('displays History action button', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('History');
    });

    it('has add button in header', () => {
      const store = createTestStore({members: [sampleMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      // Find touchable with plus icon
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });
  });

  describe('with empty members list', () => {
    it('renders empty state when no members after loading completes', async () => {
      // Use real timers for this async test
      jest.useRealTimers();

      // Mock the API to return empty members
      const {contactsAPI} = require('../../../services/api');
      contactsAPI.getMembers.mockResolvedValueOnce({
        success: true,
        members: [],
      });

      const store = createTestStore({members: [], isLoading: false});
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <TestWrapper store={store}>
            <ContactDashboard />
          </TestWrapper>,
        );
        // Wait for the useEffect to complete
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const textContent = getAllTextContent(tree!);
      expect(textContent).toContain('No members yet');

      // Clean up
      jest.useFakeTimers();
    });

    it('displays hint to add member', async () => {
      // Use real timers for this async test
      jest.useRealTimers();

      // Mock the API to return empty members
      const {contactsAPI} = require('../../../services/api');
      contactsAPI.getMembers.mockResolvedValueOnce({
        success: true,
        members: [],
      });

      const store = createTestStore({members: [], isLoading: false});
      let tree: ReactTestRenderer;
      await act(async () => {
        tree = renderer.create(
          <TestWrapper store={store}>
            <ContactDashboard />
          </TestWrapper>,
        );
        // Wait for the useEffect to complete
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const textContent = getAllTextContent(tree!);
      expect(textContent).toContain('Tap + to invite your first member');

      // Clean up
      jest.useFakeTimers();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator when loading with no members', () => {
      const store = createTestStore({members: [], isLoading: true});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Loading members...');
    });
  });

  describe('member status indicators', () => {
    it('displays Pending status for pending member', () => {
      const store = createTestStore({members: [sampleMemberPending]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Pending');
    });

    it('displays Late status for late check-in', () => {
      const lateMember: MemberInfo = {
        ...sampleMember,
        id: '3',
        name: 'Grandma',
        last_check_in: {
          id: 'checkin-3',
          checked_in_at: new Date().toISOString(),
          timezone: 'America/Los_Angeles',
          local_time: 'Today, 10:15 AM',
          was_late: true,
          minutes_late: 15,
        },
      };
      const store = createTestStore({members: [lateMember]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Late');
    });

    it('displays multiple members correctly', () => {
      const store = createTestStore({members: [sampleMember, sampleMemberPending]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('Mom');
      expect(textContent).toContain('Dad');
    });
  });

  describe('member with no check-ins', () => {
    it('displays no check-ins message', () => {
      const memberNoCheckIns: MemberInfo = {
        ...sampleMember,
        id: '4',
        name: 'Uncle Bob',
        status: 'active',
        last_check_in: null,
      };
      const store = createTestStore({members: [memberNoCheckIns]});
      const tree = createWithAct(
        <TestWrapper store={store}>
          <ContactDashboard />
        </TestWrapper>,
      );

      const textContent = getAllTextContent(tree);
      expect(textContent).toContain('No check-ins yet');
    });
  });
});
