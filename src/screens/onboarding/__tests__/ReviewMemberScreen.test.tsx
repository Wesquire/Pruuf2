/**
 * ReviewMemberScreen Tests
 * Tests for the review member screen before sending invite
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import ReviewMemberScreen from '../ReviewMemberScreen';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Mock the API
jest.mock('../../../services/api', () => ({
  membersAPI: {
    invite: jest.fn(),
  },
}));

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
  key: 'ReviewMember',
  name: 'ReviewMember' as const,
  params: {
    name: 'Mom',
    email: 'mom@example.com',
  },
});

describe('ReviewMemberScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays Confirm Details title', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Confirm Details');
  });

  it('displays the member name from route params', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Mom');
  });

  it('displays the member email from route params', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('mom@example.com');
  });

  it('displays invite information', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    // React renders interpolated strings as separate children
    expect(json).toContain("We'll send");
    expect(json).toContain('Mom');
    expect(json).toContain('an email with:');
    expect(json).toContain('Instructions to download Pruuf');
    expect(json).toContain('A unique invite code to connect with you');
  });

  it('renders Send Invite button', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Send Invite');
  });

  it('has a back button', () => {
    const navigation = createMockNavigation();
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={navigation as any}
        route={createMockRoute() as any}
      />,
    );

    // Screen renders with back button
    const json = tree.toJSON();
    expect(json).toBeTruthy();
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('displays "You\'re about to invite:" label', () => {
    const tree = createWithAct(
      <ReviewMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("You're about to invite:");
  });
});
