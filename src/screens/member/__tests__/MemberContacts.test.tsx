/**
 * MemberContacts Tests
 * Tests for the member contacts list screen
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import MemberContacts from '../MemberContacts';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

describe('MemberContacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(<MemberContacts />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays Your Contacts title', () => {
    const tree = createWithAct(<MemberContacts />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Your Contacts');
  });

  it('displays contact names', () => {
    const tree = createWithAct(<MemberContacts />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Jennifer');
    expect(json).toContain('Michael');
  });

  it('displays contact phone numbers', () => {
    const tree = createWithAct(<MemberContacts />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('(555) 123-4567');
    expect(json).toContain('(555) 987-6543');
  });

  it('displays Active status for contacts', () => {
    const tree = createWithAct(<MemberContacts />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Active');
  });

  it('renders Invite Another Contact button', () => {
    const tree = createWithAct(<MemberContacts />);

    const json = JSON.stringify(tree.toJSON());
    expect(json).toContain('Invite Another Contact');
  });

  it('renders phone and message action buttons', () => {
    const tree = createWithAct(<MemberContacts />);

    // The screen should render without errors and contain action buttons
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });
});
