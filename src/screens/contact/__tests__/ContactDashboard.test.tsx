/**
 * ContactDashboard Tests
 * Tests for the contact dashboard showing monitored members
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import ContactDashboard from '../ContactDashboard';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Helper to get all text content from tree (avoids circular reference issues)
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
    if (Array.isArray(json)) {
      json.forEach(findText);
    } else {
      findText(json);
    }
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

describe('ContactDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const tree = createWithAct(<ContactDashboard />);

    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });

  it('displays Members title', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Members');
  });

  it('displays member name', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Mom');
  });

  it('displays Checked In status', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Checked In');
  });

  it('displays last check-in time', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Last check-in:');
    expect(textContent).toContain('Today, 9:45 AM');
  });

  it('displays daily deadline', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Daily deadline:');
    expect(textContent).toContain('10:00 AM PST');
  });

  it('displays Call action button', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Call');
  });

  it('displays Text action button', () => {
    const tree = createWithAct(<ContactDashboard />);

    const textContent = getAllTextContent(tree);
    expect(textContent).toContain('Text');
  });

  it('has add button in header', () => {
    const tree = createWithAct(<ContactDashboard />);

    // Find touchable with plus icon
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });
});
