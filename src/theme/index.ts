/**
 * Pruuf Theme System
 * Central export for all theme-related constants
 */

export {colors} from './colors';
export type {Colors} from './colors';

export {
  typography,
  fontFamily,
  fontSizeMultipliers,
  getScaledTypography,
} from './typography';
export type {Typography, FontSizePreference} from './typography';

export {spacing, touchTargets, borderRadius, shadows} from './spacing';
export type {Spacing} from './spacing';

// Theme object combining all theme elements
import {colors} from './colors';
import {typography, fontFamily} from './typography';
import {spacing, touchTargets, borderRadius, shadows} from './spacing';

export const theme = {
  colors,
  typography,
  fontFamily,
  spacing,
  touchTargets,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
