/**
 * Button Component
 * Accessible button with multiple variants and sizes
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, touchTargets, borderRadius } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityHint?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
  accessibilityHint,
  testID,
}) => {
  const buttonStyles = getButtonStyles(variant, size, disabled, fullWidth);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyles.button, style]}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={getSpinnerColor(variant)}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={[buttonStyles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

function getSpinnerColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return colors.textInverse;
    case 'secondary':
    case 'outline':
    case 'ghost':
      return colors.primary;
    default:
      return colors.textInverse;
  }
}

function getButtonStyles(
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  fullWidth: boolean
) {
  // Height based on size
  const heights: Record<ButtonSize, number> = {
    small: 40,
    medium: 50,
    large: touchTargets.standard, // 60
    xlarge: 80,
  };

  const fontSizes: Record<ButtonSize, number> = {
    small: 14,
    medium: 16,
    large: 16,
    xlarge: 20,
  };

  // Base button style
  const baseButton: ViewStyle = {
    height: heights[size],
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minWidth: size === 'large' || size === 'xlarge' ? 200 : 120,
    ...(fullWidth && { width: '100%' }),
  };

  // Base text style
  const baseText: TextStyle = {
    fontSize: fontSizes[size],
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  };

  // Apply variant-specific styles
  let buttonStyle: ViewStyle = { ...baseButton };
  let textStyle: TextStyle = { ...baseText };

  switch (variant) {
    case 'primary':
      buttonStyle.backgroundColor = disabled
        ? colors.textDisabled
        : colors.primary;
      textStyle.color = colors.textInverse;
      break;

    case 'secondary':
      buttonStyle.backgroundColor = disabled
        ? colors.backgroundGray
        : colors.accentLight;
      textStyle.color = disabled ? colors.textDisabled : colors.accent;
      break;

    case 'outline':
      buttonStyle.backgroundColor = 'transparent';
      buttonStyle.borderWidth = 2;
      buttonStyle.borderColor = disabled ? colors.border : colors.primary;
      textStyle.color = disabled ? colors.textDisabled : colors.primary;
      break;

    case 'danger':
      buttonStyle.backgroundColor = disabled
        ? colors.textDisabled
        : colors.error;
      textStyle.color = colors.textInverse;
      break;

    case 'ghost':
      buttonStyle.backgroundColor = 'transparent';
      textStyle.color = disabled ? colors.textDisabled : colors.accent;
      break;
  }

  return StyleSheet.create({
    button: buttonStyle,
    text: textStyle,
  });
}

export default Button;
