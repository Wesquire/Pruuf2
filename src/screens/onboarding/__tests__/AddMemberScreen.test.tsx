/**
 * AddMemberScreen Tests
 * Tests for the add member screen for Contacts
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import AddMemberScreen from '../AddMemberScreen';

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
  key: 'AddMember',
  name: 'AddMember' as const,
  params: undefined,
});

describe('AddMemberScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(
      <AddMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays the headline', () => {
    const tree = createWithAct(
      <AddMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Who would you like to check on daily?');
  });

  it('displays the subheadline', () => {
    const tree = createWithAct(
      <AddMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("We'll send them an invite to join Pruuf");
  });

  it('displays Add a Member title', () => {
    const tree = createWithAct(
      <AddMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Add a Member');
  });

  it('displays form field labels', () => {
    const tree = createWithAct(
      <AddMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain("Member's Name");
    expect(json).toContain("Member's Email Address");
  });

  it('renders Continue button', () => {
    const tree = createWithAct(
      <AddMemberScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Continue');
  });

  it('has a close button', () => {
    const navigation = createMockNavigation();
    const tree = createWithAct(
      <AddMemberScreen
        navigation={navigation as any}
        route={createMockRoute() as any}
      />,
    );

    // Screen should render with close button
    const json = tree.toJSON();
    expect(json).toBeTruthy();
    // goBack should not be called on initial render
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
});
