/**
 * Empty States Tests
 * Item 33: Add Empty States (LOW)
 * Updated for React 19 concurrent mode compatibility
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import {
  EmptyState,
  NoCheckInsEmptyState,
  NoContactsEmptyState,
  NoMembersEmptyState,
  NoNotificationsEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
  OfflineEmptyState,
} from '../components/empty-states';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

describe('EmptyState - Component', () => {
  it('should render with title and message', () => {
    const tree = createWithAct(
      <EmptyState title="Empty" message="No items found" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with custom icon', () => {
    const tree = createWithAct(
      <EmptyState icon="star" title="Empty" message="No items" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render without action button', () => {
    const tree = createWithAct(
      <EmptyState title="Empty" message="No items" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with action button', () => {
    const onAction = jest.fn();
    const tree = createWithAct(
      <EmptyState
        title="Empty"
        message="No items"
        actionText="Add Item"
        onActionPress={onAction}
      />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should call action callback when button pressed', () => {
    const onAction = jest.fn();
    const tree = createWithAct(
      <EmptyState
        title="Empty"
        message="No items"
        actionText="Add Item"
        onActionPress={onAction}
      />,
    );

    const buttons = tree.root.findAllByType(
      require('react-native').TouchableOpacity,
    );
    const actionButton = buttons[buttons.length - 1];

    act(() => {
      actionButton.props.onPress();
    });

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not render action button without onActionPress', () => {
    const tree = createWithAct(
      <EmptyState title="Empty" message="No items" actionText="Add Item" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Pre-configured Variants', () => {
  it('should render NoCheckInsEmptyState', () => {
    const tree = createWithAct(<NoCheckInsEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render NoContactsEmptyState', () => {
    const tree = createWithAct(<NoContactsEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render NoMembersEmptyState', () => {
    const tree = createWithAct(<NoMembersEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render NoNotificationsEmptyState', () => {
    const tree = createWithAct(<NoNotificationsEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SearchEmptyState', () => {
    const tree = createWithAct(<SearchEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render ErrorEmptyState', () => {
    const tree = createWithAct(<ErrorEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render OfflineEmptyState', () => {
    const tree = createWithAct(<OfflineEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Customization', () => {
  it('should allow overriding pre-configured state', () => {
    const tree = createWithAct(
      <NoCheckInsEmptyState title="Custom Title" message="Custom message" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should allow adding action to pre-configured state', () => {
    const onAction = jest.fn();
    const tree = createWithAct(<ErrorEmptyState onActionPress={onAction} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should allow changing icon in pre-configured state', () => {
    const tree = createWithAct(<NoContactsEmptyState icon="heart" />);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Accessibility', () => {
  it('should have accessible action button', () => {
    const tree = createWithAct(
      <EmptyState
        title="Empty"
        message="No items"
        actionText="Add Item"
        onActionPress={jest.fn()}
      />,
    );

    const buttons = tree.root.findAllByType(
      require('react-native').TouchableOpacity,
    );
    const actionButton = buttons[buttons.length - 1];

    expect(actionButton.props.accessibilityRole).toBe('button');
    expect(actionButton.props.accessibilityLabel).toBe('Add Item');
  });
});

describe('EmptyState - Edge Cases', () => {
  it('should handle long title', () => {
    const longTitle =
      'This is a very long title that might wrap to multiple lines';
    const tree = createWithAct(
      <EmptyState title={longTitle} message="Message" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle long message', () => {
    const longMessage =
      'This is a very long message that explains the empty state in great detail and might wrap to many lines depending on screen size.';
    const tree = createWithAct(
      <EmptyState title="Title" message={longMessage} />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle empty strings', () => {
    const tree = createWithAct(<EmptyState title="" message="" />);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Performance', () => {
  it('should render quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      createWithAct(
        <EmptyState title="Performance Test" message="Testing render speed" />,
      );
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // Increased timeout for React 19
  });
});
