/**
 * ContactSettings Tests
 * Tests for the contact settings screen
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import ContactSettings from '../ContactSettings';

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
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// Mock useConfirmDialog hook
jest.mock('../../../hooks/useConfirmDialog', () => ({
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
    showConfirm: jest.fn(),
  }),
}));

// Mock Redux
jest.mock('../../../store', () => ({
  useAppDispatch: () => jest.fn(),
}));

jest.mock('../../../store/slices/authSlice', () => ({
  logout: jest.fn(),
}));

describe('ContactSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays Settings title', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Settings');
  });

  it('displays Payment Method setting', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Payment Method');
    expect(json).toContain('4242');
  });

  it('displays Notification Settings option', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Notification Settings');
  });

  it('displays Text Size setting', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Text Size');
    expect(json).toContain('Standard');
  });

  it('displays Phone Number setting', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Phone Number');
    expect(json).toContain('(555) 123-4567');
  });

  it('displays Help & Support option', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Help & Support');
  });

  it('displays Log Out option', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Log Out');
  });

  it('displays Delete Account option', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Delete Account');
  });

  it('displays subscription info', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Current Plan');
    expect(json).toContain('$4.99/month');
  });

  it('displays next billing date', () => {
    const tree = createWithAct(<ContactSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Next billing');
    expect(json).toContain('Dec 18, 2025');
  });
});
