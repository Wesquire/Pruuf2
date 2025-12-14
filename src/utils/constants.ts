/**
 * UI Constants
 * Re-exports from theme system + additional constants for convenience
 */

import {colors} from '../theme/colors';
import {spacing, touchTargets, borderRadius} from '../theme/spacing';
import {fontSizeMultipliers} from '../theme/typography';
import type {FontSizePreference} from '../theme/typography';

// Re-export colors with uppercase for backward compatibility
export const COLORS = {
  // Brand colors
  primary: colors.primary,
  primaryDark: colors.primaryDark,
  primaryLight: colors.primaryLight,
  accent: colors.accent,
  accentDark: colors.accentDark,
  accentLight: colors.accentLight,

  // Semantic colors
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,

  // Text colors
  text: colors.textPrimary,
  textPrimary: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textDisabled: colors.textDisabled,
  textInverse: colors.textInverse,

  // Background colors
  background: colors.background,
  backgroundGray: colors.backgroundGray,
  backgroundDark: colors.backgroundDark,
  lightGray: colors.backgroundGray,
  lightBlue: colors.accentLight,

  // Border colors
  border: colors.border,
  borderLight: colors.borderLight,
  borderDark: colors.borderDark,

  // Status indicators
  statusActive: colors.statusActive,
  statusPending: colors.statusPending,
  statusInactive: colors.statusInactive,
  statusError: colors.statusError,

  // Common color names
  white: colors.textInverse,
  black: colors.textPrimary,
} as const;

// Re-export spacing with uppercase
export const SPACING = {
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
} as const;

// Font size constants - base font sizes for each preference level
// These are base values that get multiplied in components
export const FONT_SIZES: Record<FontSizePreference, number> = {
  standard: 16, // 16px base (1.0x)
  large: 20, // 20px base (1.25x)
  extraLarge: 24, // 24px base (1.5x)
} as const;

// Touch target sizes
export const TOUCH_TARGETS = {
  minimum: touchTargets.minimum,
  standard: touchTargets.standard,
  large: touchTargets.large,
} as const;

// Border radius
export const BORDER_RADIUS = {
  xs: borderRadius.xs,
  sm: borderRadius.sm,
  md: borderRadius.md,
  lg: borderRadius.lg,
  xl: borderRadius.xl,
  full: borderRadius.full,
} as const;

// Font size multipliers (for reference)
export const FONT_MULTIPLIERS = fontSizeMultipliers;

// Export types
export type {FontSizePreference};
