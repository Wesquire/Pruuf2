/**
 * Card Component
 * Container with shadow and optional press action
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  testID,
}) => {
  const cardStyle = getCardStyle(variant);
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      style={[styles.base, cardStyle, style]}
      activeOpacity={onPress ? 0.9 : 1}
      testID={testID}
      accessible={!!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {children}
    </Component>
  );
};

function getCardStyle(variant: 'elevated' | 'outlined' | 'filled'): ViewStyle {
  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: colors.background,
        ...shadows.medium,
      };
    case 'outlined':
      return {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'filled':
      return {
        backgroundColor: colors.backgroundGray,
      };
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
});

export default Card;
