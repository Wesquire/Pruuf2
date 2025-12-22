/**
 * MemberDashboard Tests
 * Tests for the main member dashboard with check-in button
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import MemberDashboard from '../MemberDashboard';
import authReducer from '../../../store/slices/authSlice';
import memberReducer from '../../../store/slices/memberSlice';
import settingsReducer from '../../../store/slices/settingsSlice';

// Track all created renderers for cleanup
let activeRenderers: ReactTestRenderer[] = [];

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  activeRenderers.push(tree!);
  return tree!;
};

// Helper to get all text content from tree
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
    findText(json);
  }
  return textNodes.join(' ');
};

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// Create mock store
const createMockStore = (overrides: any = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      member: memberReducer,
      settings: settingsReducer,
    },
    preloadedState: {
      auth: {
        isLoggedIn: true,
        isInitialized: true,
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          is_member: true,
        },
        accessToken: 'test-token',
        refreshToken: null,
        isLoading: false,
        error: null,
      },
      member: {
        contacts: overrides.contacts || [],
        members: [],
        checkIns: [],
        pendingInvites: [],
        selectedMember: null,
        isLoading: false,
        error: null,
      },
      settings: {
        fontSize: 'standard',
        notificationsEnabled: true,
        emailNotificationsEnabled: true,
        remindersEnabled: true,
        reminderMinutesBefore: 60,
        timezone: 'America/Los_Angeles',
      },
    },
  });
};

describe('MemberDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    activeRenderers = [];
  });

  afterEach(() => {
    // Cleanup all renderers within act() to stop animations before Jest teardown
    act(() => {
      activeRenderers.forEach(tree => {
        if (tree) {
          tree.unmount();
        }
      });
    });
    activeRenderers = [];
  });

  it('renders correctly', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    expect(tree.toJSON()).toBeTruthy();
  });

  it('displays the I\'m OK button text', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain("I'm OK");
  });

  it('displays Tap to check in text', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Tap to check in');
  });

  it('displays the deadline banner', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Next check-in:');
  });

  it('displays Your Contacts section', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Your Contacts');
  });

  it('shows empty state when no contacts', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('No contacts yet');
  });

  it('displays contacts when available', () => {
    const store = createMockStore({
      contacts: [
        {id: '1', name: 'Jennifer', status: 'active'},
        {id: '2', name: 'Michael', status: 'active'},
      ],
    });
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Jennifer');
    expect(textContent).toContain('Michael');
  });

  it('has accessible check-in button', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    // Find button with accessibility props
    const buttons = tree.root.findAllByProps({accessibilityRole: 'button'});
    expect(buttons.length).toBeGreaterThan(0);

    // Check for I'm OK button with accessibilityLabel
    const okButton = tree.root.findByProps({accessibilityLabel: "I'm OK"});
    expect(okButton).toBeTruthy();
  });

  it('displays timezone badge', () => {
    const store = createMockStore();
    const tree = createWithAct(
      <Provider store={store}>
        <MemberDashboard />
      </Provider>,
    );

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('PST');
  });
});
