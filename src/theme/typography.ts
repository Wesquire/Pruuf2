/**
 * Pruuf Typography Scale
 * Supports Dynamic Type with font size multipliers
 */

import { Platform, TextStyle } from 'react-native';

// Font size multipliers for accessibility settings
export const fontSizeMultipliers = {
  standard: 1.0,
  large: 1.25,
  extraLarge: 1.5,
};

export type FontSizePreference = keyof typeof fontSizeMultipliers;

// Base typography (before multiplier applied)
const baseTypography = {
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 34,
    letterSpacing: 0,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 30,
    letterSpacing: 0,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 26,
    letterSpacing: 0,
  },

  // Body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: 0.15,
  },

  // UI elements
  button: {
    fontSize: 16,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 18,
    letterSpacing: 0.1,
  },

  // Special
  checkInButton: {
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 38,
    letterSpacing: 0,
  },
};

// Function to get scaled typography
export const getScaledTypography = (
  preference: FontSizePreference = 'standard'
) => {
  const multiplier = fontSizeMultipliers[preference];

  const scaled: typeof baseTypography = {} as typeof baseTypography;

  (Object.keys(baseTypography) as Array<keyof typeof baseTypography>).forEach(
    key => {
      const base = baseTypography[key];
      scaled[key] = {
        ...base,
        fontSize: Math.round(base.fontSize * multiplier),
        lineHeight: Math.round(base.lineHeight * multiplier),
      };
    }
  );

  return scaled;
};

// Default typography (standard size)
export const typography = baseTypography;

// System font family
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export type Typography = typeof typography;
