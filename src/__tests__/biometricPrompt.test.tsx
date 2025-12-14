/**
 * BiometricPrompt Component Tests
 * Item 29: Add Biometric Authentication (MEDIUM)
 */

import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {BiometricPrompt} from '../components/auth/BiometricPrompt';

describe('BiometricPrompt - Component', () => {
  const defaultProps = {
    visible: true,
    biometryType: 'TouchID' as const,
    onEnable: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('should render when visible', () => {
    const tree = renderer.create(<BiometricPrompt {...defaultProps} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} visible={false} />,
    );
    const modal = tree.root.findByType(require('react-native').Modal);
    expect(modal.props.visible).toBe(false);
  });

  it('should render with Face ID', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} biometryType="FaceID" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should render with generic biometrics', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} biometryType="Biometrics" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should use custom title', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} title="Custom Title" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should use custom message', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} message="Custom message" />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should call onEnable when enable button pressed', () => {
    const onEnable = jest.fn();

    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} onEnable={onEnable} />,
    );

    const buttons = tree.root.findAllByType(
      require('react-native').TouchableOpacity,
    );
    const enableButton = buttons.find(btn =>
      btn.props.accessibilityLabel?.includes('Enable'),
    );

    act(() => {
      enableButton?.props.onPress();
    });

    expect(onEnable).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when dismiss button pressed', () => {
    const onDismiss = jest.fn();

    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} onDismiss={onDismiss} />,
    );

    const buttons = tree.root.findAllByType(
      require('react-native').TouchableOpacity,
    );
    const dismissButton = buttons.find(
      btn => btn.props.accessibilityLabel === 'Maybe later',
    );

    act(() => {
      dismissButton?.props.onPress();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when modal requests close', () => {
    const onDismiss = jest.fn();

    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} onDismiss={onDismiss} />,
    );

    const modal = tree.root.findByType(require('react-native').Modal);

    act(() => {
      modal.props.onRequestClose();
    });

    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('BiometricPrompt - Accessibility', () => {
  const defaultProps = {
    visible: true,
    biometryType: 'TouchID' as const,
    onEnable: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('should have accessible buttons', () => {
    const tree = renderer.create(<BiometricPrompt {...defaultProps} />);

    const buttons = tree.root.findAllByType(
      require('react-native').TouchableOpacity,
    );

    const enableButton = buttons.find(btn =>
      btn.props.accessibilityLabel?.includes('Enable'),
    );
    const dismissButton = buttons.find(
      btn => btn.props.accessibilityLabel === 'Maybe later',
    );

    expect(enableButton?.props.accessibilityRole).toBe('button');
    expect(dismissButton?.props.accessibilityRole).toBe('button');
  });

  it('should have Face ID specific accessibility label', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} biometryType="FaceID" />,
    );

    const buttons = tree.root.findAllByType(
      require('react-native').TouchableOpacity,
    );
    const enableButton = buttons.find(btn =>
      btn.props.accessibilityLabel?.includes('Enable'),
    );

    expect(enableButton?.props.accessibilityLabel).toContain('FaceID');
  });
});

describe('BiometricPrompt - Edge Cases', () => {
  const defaultProps = {
    visible: true,
    biometryType: 'TouchID' as const,
    onEnable: jest.fn(),
    onDismiss: jest.fn(),
  };

  it('should handle null biometry type', () => {
    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} biometryType={null} />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle very long custom title', () => {
    const longTitle =
      'This is a very long title that might wrap to multiple lines in the modal dialog';

    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} title={longTitle} />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });

  it('should handle very long custom message', () => {
    const longMessage =
      'This is a very long message that explains the benefits of using biometric authentication in great detail and should wrap nicely across multiple lines in the modal.';

    const tree = renderer.create(
      <BiometricPrompt {...defaultProps} message={longMessage} />,
    );
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('BiometricPrompt - Performance', () => {
  it('should render quickly', () => {
    const start = Date.now();

    for (let i = 0; i < 50; i++) {
      renderer.create(
        <BiometricPrompt
          visible={true}
          biometryType="TouchID"
          onEnable={jest.fn()}
          onDismiss={jest.fn()}
        />,
      );
    }

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(2000);
  });
});
