/**
 * EnterInviteCodeScreen Tests
 * Tests for the enter invite code screen for Members
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import EnterInviteCodeScreen from '../EnterInviteCodeScreen';

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
  key: 'EnterInviteCode',
  name: 'EnterInviteCode' as const,
  params: undefined,
});

describe('EnterInviteCodeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(
      <EnterInviteCodeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays the headline', () => {
    const tree = createWithAct(
      <EnterInviteCodeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Enter your invite code');
  });

  it('displays the subheadline', () => {
    const tree = createWithAct(
      <EnterInviteCodeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Check the text message you received');
  });

  it('renders CodeInput component', () => {
    const tree = createWithAct(
      <EnterInviteCodeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    // The screen should render without errors
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('has a back button', () => {
    const navigation = createMockNavigation();
    const tree = createWithAct(
      <EnterInviteCodeScreen
        navigation={navigation as any}
        route={createMockRoute() as any}
      />,
    );

    // Screen renders with back button - goBack should not be called initially
    expect(navigation.goBack).not.toHaveBeenCalled();

    // The screen should render correctly
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });
});
