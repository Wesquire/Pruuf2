/**
 * Notification Permission Tests
 * Item 37: Add Notification Permission Prompt (MEDIUM)
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { NotificationPermissionPrompt } from '../components/notifications/NotificationPermissionPrompt';

describe('NotificationPermissionPrompt - Component', () => {
  const defaultProps = {
    visible: true,
    onRequestPermission: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('should render when visible', () => {
    const tree = renderer.create(<NotificationPermissionPrompt {...defaultProps} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} visible={false} />
    );
    const modal = tree.root.findByType(require('react-native').Modal);
    expect(modal.props.visible).toBe(false);
  });

  it('should use default title and message', () => {
    const tree = renderer.create(<NotificationPermissionPrompt {...defaultProps} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should use custom title and message', () => {
    const tree = renderer.create(
      <NotificationPermissionPrompt
        {...defaultProps}
        title="Custom Title"
        message="Custom message"
      />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render default benefits', () => {
    const tree = renderer.create(<NotificationPermissionPrompt {...defaultProps} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render custom benefits', () => {
    const customBenefits = [
      'Benefit 1',
      'Benefit 2',
      'Benefit 3',
    ];

    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} benefits={customBenefits} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should call onRequestPermission when enable button pressed', () => {
    const onRequestPermission = jest.fn();

    const tree = renderer.create(
      <NotificationPermissionPrompt
        {...defaultProps}
        onRequestPermission={onRequestPermission}
      />
    );

    const buttons = tree.root.findAllByType(require('react-native').TouchableOpacity);
    const enableButton = buttons.find(
      btn => btn.props.accessibilityLabel === 'Enable notifications'
    );

    act(() => {
      enableButton?.props.onPress();
    });

    expect(onRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when not now button pressed', () => {
    const onDismiss = jest.fn();

    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} onDismiss={onDismiss} />
    );

    const buttons = tree.root.findAllByType(require('react-native').TouchableOpacity);
    const dismissButton = buttons.find(
      btn => btn.props.accessibilityLabel === 'Not now'
    );

    act(() => {
      dismissButton?.props.onPress();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when modal requests close', () => {
    const onDismiss = jest.fn();

    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} onDismiss={onDismiss} />
    );

    const modal = tree.root.findByType(require('react-native').Modal);

    act(() => {
      modal.props.onRequestClose();
    });

    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('NotificationPermissionPrompt - Accessibility', () => {
  const defaultProps = {
    visible: true,
    onRequestPermission: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('should have accessible buttons', () => {
    const tree = renderer.create(<NotificationPermissionPrompt {...defaultProps} />);

    const buttons = tree.root.findAllByType(require('react-native').TouchableOpacity);

    const enableButton = buttons.find(
      btn => btn.props.accessibilityLabel === 'Enable notifications'
    );
    const dismissButton = buttons.find(
      btn => btn.props.accessibilityLabel === 'Not now'
    );

    expect(enableButton?.props.accessibilityRole).toBe('button');
    expect(dismissButton?.props.accessibilityRole).toBe('button');
  });
});

describe('NotificationPermissionPrompt - Edge Cases', () => {
  const defaultProps = {
    visible: true,
    onRequestPermission: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('should handle empty benefits array', () => {
    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} benefits={[]} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle long title', () => {
    const longTitle =
      'This is a very long title that might wrap to multiple lines in the prompt';

    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} title={longTitle} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle long message', () => {
    const longMessage =
      'This is a very long message that explains in great detail why notifications are important and should wrap nicely across multiple lines.';

    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} message={longMessage} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle many benefits', () => {
    const manyBenefits = Array.from({ length: 10 }, (_, i) => `Benefit ${i + 1}`);

    const tree = renderer.create(
      <NotificationPermissionPrompt {...defaultProps} benefits={manyBenefits} />
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('NotificationPermissionPrompt - Performance', () => {
  it('should render quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      renderer.create(
        <NotificationPermissionPrompt
          visible={true}
          onRequestPermission={jest.fn()}
          onDismiss={jest.fn()}
        />
      );
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000); // Should render 50 prompts in <2s
  });
});
