/**
 * InviteSentScreen Tests
 * Tests for the invite sent confirmation screen
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import InviteSentScreen from '../InviteSentScreen';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const createMockNavigation = () => ({
  navigate: mockNavigate,
  goBack: mockGoBack,
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

const createMockRoute = () => ({
  key: 'InviteSent',
  name: 'InviteSent' as const,
  params: {
    name: 'Mom',
    inviteCode: 'ABC123',
  },
});

describe('InviteSentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays the success headline with member name', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    // React renders interpolated strings as separate children
    expect(json).toContain('Invite sent to');
    expect(json).toContain('Mom');
  });

  it('displays the invite code', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('ABC123');
  });

  it('displays the code label', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Their invite code:');
  });

  it('displays hint about calling the member', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    // React renders interpolated strings as separate children
    expect(json).toContain('You might want to call');
    expect(json).toContain('Mom');
    expect(json).toContain('to let them know the text is coming');
  });

  it('renders Go to Dashboard button', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Go to Dashboard');
  });

  it('navigates to MainTabs when button is pressed', () => {
    const tree = createWithAct(
      <InviteSentScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    // Find the Button component and trigger onPress
    const buttons = tree.root.findAllByProps({title: 'Go to Dashboard'});
    expect(buttons.length).toBeGreaterThan(0);

    act(() => {
      buttons[0].props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs');
  });
});
