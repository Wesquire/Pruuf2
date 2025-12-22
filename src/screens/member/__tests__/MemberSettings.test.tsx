/**
 * MemberSettings Tests
 * Tests for the member settings screen
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import MemberSettings from '../MemberSettings';

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

describe('MemberSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays Settings title', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Settings');
  });

  it('displays Check-in Time setting', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Check-in Time');
    expect(json).toContain('10:00 AM PST');
  });

  it('displays Daily Reminder toggle', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Daily Reminder');
    expect(json).toContain('1 hour before check-in');
  });

  it('displays Notification Settings option', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Notification Settings');
  });

  it('displays Text Size setting', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Text Size');
    expect(json).toContain('Large');
  });

  it('displays Your Contacts setting', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Your Contacts');
    expect(json).toContain('2 active');
  });

  it('displays Phone Number setting', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Phone Number');
    expect(json).toContain('(555) 987-6543');
  });

  it('displays Help & Support option', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Help & Support');
  });

  it('displays Delete Account option', () => {
    const tree = createWithAct(<MemberSettings />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Delete Account');
  });
});
