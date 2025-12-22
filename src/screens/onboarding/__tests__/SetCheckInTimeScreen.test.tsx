/**
 * SetCheckInTimeScreen Tests
 * Tests for the set check-in time screen for Members
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import SetCheckInTimeScreen from '../SetCheckInTimeScreen';

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
  key: 'SetCheckInTime',
  name: 'SetCheckInTime' as const,
  params: undefined,
});

describe('SetCheckInTimeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(
      <SetCheckInTimeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays the headline', () => {
    const tree = createWithAct(
      <SetCheckInTimeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('When should we remind you?');
  });

  it('displays the subheadline', () => {
    const tree = createWithAct(
      <SetCheckInTimeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Choose a time for your daily check-in');
  });

  it('displays default time of 10:00 AM', () => {
    const tree = createWithAct(
      <SetCheckInTimeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    // React renders time as separate children: "10:00" and " AM"
    expect(json).toContain('10:00');
    expect(json).toContain('AM');
  });

  it('renders Continue button', () => {
    const tree = createWithAct(
      <SetCheckInTimeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Continue');
  });

  it('navigates to MainTabs when Continue is pressed', () => {
    const tree = createWithAct(
      <SetCheckInTimeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    // Find the Button component and trigger onPress
    const buttons = tree.root.findAllByProps({title: 'Continue'});
    expect(buttons.length).toBeGreaterThan(0);

    act(() => {
      buttons[0].props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('MainTabs');
  });
});
