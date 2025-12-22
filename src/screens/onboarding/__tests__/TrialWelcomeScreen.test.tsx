/**
 * TrialWelcomeScreen Tests
 * Tests for the trial welcome screen shown to new Contact users
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import TrialWelcomeScreen from '../TrialWelcomeScreen';

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
  key: 'TrialWelcome',
  name: 'TrialWelcome' as const,
  params: undefined,
});

describe('TrialWelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(
      <TrialWelcomeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays the trial headline', () => {
    const tree = createWithAct(
      <TrialWelcomeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Your 30-day free trial starts now!');
  });

  it('displays all trial benefits', () => {
    const tree = createWithAct(
      <TrialWelcomeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Monitor unlimited loved ones');
    expect(json).toContain('Get instant alerts if they miss check-ins');
    expect(json).toContain('No credit card required during trial');
    expect(json).toContain('$4.99/month after trial. Cancel anytime.');
  });

  it('displays terms text', () => {
    const tree = createWithAct(
      <TrialWelcomeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('By continuing, you agree to our Terms of Service and Privacy Policy');
  });

  it('renders Add Your First Member button', () => {
    const tree = createWithAct(
      <TrialWelcomeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Add Your First Member');
  });

  it('navigates to AddMember when button is pressed', () => {
    const tree = createWithAct(
      <TrialWelcomeScreen
        navigation={createMockNavigation() as any}
        route={createMockRoute() as any}
      />,
    );

    // Find button by testID and simulate press
    const button = tree.root.findByProps({testID: 'trial-welcome-add-member-button'});
    act(() => {
      button.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('AddMember');
  });
});
