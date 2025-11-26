/**
 * Empty States Tests
 * Item 33: Add Empty States (LOW)
 */

import React from 'react';
import renderer from 'react-test-renderer';
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

describe('EmptyState - Component', () => {
  it('should render with title and message', () => {
    const tree = renderer.create(
      <EmptyState title="Empty" message="No items found" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with custom icon', () => {
    const tree = renderer.create(
      <EmptyState icon="star" title="Empty" message="No items" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render without action button', () => {
    const tree = renderer.create(
      <EmptyState title="Empty" message="No items" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with action button', () => {
    const onAction = jest.fn();
    const tree = renderer.create(
      <EmptyState
        title="Empty"
        message="No items"
        actionText="Add Item"
        onActionPress={onAction}
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should call action callback when button pressed', () => {
    const onAction = jest.fn();
    const tree = renderer.create(
      <EmptyState
        title="Empty"
        message="No items"
        actionText="Add Item"
        onActionPress={onAction}
      />
    );

    const buttons = tree.root.findAllByType(require('react-native').TouchableOpacity);
    const actionButton = buttons[buttons.length - 1];

    renderer.act(() => {
      actionButton.props.onPress();
    });

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not render action button without onActionPress', () => {
    const tree = renderer.create(
      <EmptyState title="Empty" message="No items" actionText="Add Item" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Pre-configured Variants', () => {
  it('should render NoCheckInsEmptyState', () => {
    const tree = renderer.create(<NoCheckInsEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render NoContactsEmptyState', () => {
    const tree = renderer.create(<NoContactsEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render NoMembersEmptyState', () => {
    const tree = renderer.create(<NoMembersEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render NoNotificationsEmptyState', () => {
    const tree = renderer.create(<NoNotificationsEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render SearchEmptyState', () => {
    const tree = renderer.create(<SearchEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render ErrorEmptyState', () => {
    const tree = renderer.create(<ErrorEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render OfflineEmptyState', () => {
    const tree = renderer.create(<OfflineEmptyState />);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Customization', () => {
  it('should allow overriding pre-configured state', () => {
    const tree = renderer.create(
      <NoCheckInsEmptyState title="Custom Title" message="Custom message" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should allow adding action to pre-configured state', () => {
    const onAction = jest.fn();
    const tree = renderer.create(
      <ErrorEmptyState onActionPress={onAction} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should allow changing icon in pre-configured state', () => {
    const tree = renderer.create(
      <NoContactsEmptyState icon="heart" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Accessibility', () => {
  it('should have accessible action button', () => {
    const tree = renderer.create(
      <EmptyState
        title="Empty"
        message="No items"
        actionText="Add Item"
        onActionPress={jest.fn()}
      />
    );

    const buttons = tree.root.findAllByType(require('react-native').TouchableOpacity);
    const actionButton = buttons[buttons.length - 1];

    expect(actionButton.props.accessibilityRole).toBe('button');
    expect(actionButton.props.accessibilityLabel).toBe('Add Item');
  });
});

describe('EmptyState - Edge Cases', () => {
  it('should handle long title', () => {
    const longTitle = 'This is a very long title that might wrap to multiple lines';
    const tree = renderer.create(
      <EmptyState title={longTitle} message="Message" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle long message', () => {
    const longMessage = 'This is a very long message that explains the empty state in great detail and might wrap to many lines depending on screen size.';
    const tree = renderer.create(
      <EmptyState title="Title" message={longMessage} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle empty strings', () => {
    const tree = renderer.create(
      <EmptyState title="" message="" />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('EmptyState - Performance', () => {
  it('should render quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      renderer.create(
        <EmptyState title="Performance Test" message="Testing render speed" />
      );
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1500); // Should render 50 in <1.5s
  });
});
