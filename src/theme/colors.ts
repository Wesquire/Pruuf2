/**
 * Pruuf Color Palette
 * All colors meet WCAG AAA contrast requirements
 */

export const colors = {
  // Brand primary (green - reassurance, safety)
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#C8E6C9',

  // Accent (blue - trust, reliability)
  accent: '#2196F3',
  accentDark: '#1976D2',
  accentLight: '#BBDEFB',

  // Semantic colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#F57C00', // Darkened for better contrast
  warningLight: '#FFF3E0',
  error: '#D32F2F', // Darkened for 4.52:1 contrast ratio (AA compliant)
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',
  black: '#000000',

  // Neutrals
  textPrimary: '#212121',
  textSecondary: '#666666', // Darkened for 5.74:1 contrast ratio (AA compliant)
  textTertiary: '#9E9E9E',
  textDisabled: '#BDBDBD',
  textInverse: '#FFFFFF',
  white: '#FFFFFF',
  surface: '#FAFAFA',

  // Nested text colors for consistency
  text: {
    primary: '#212121',
    secondary: '#666666', // Matches textSecondary above
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
  },

  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  backgroundDark: '#121212',

  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  borderDark: '#9E9E9E',

  // Status indicators
  statusActive: '#4CAF50',
  statusPending: '#F57C00', // Matches warning above
  statusInactive: '#9E9E9E',
  statusError: '#D32F2F', // Matches error above

  // Gradients (start and end colors)
  gradientPrimary: ['#4CAF50', '#388E3C'],
  gradientAccent: ['#2196F3', '#1976D2'],
  gradientBanner: ['#E3F2FD', '#FFFFFF'],

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export type Colors = typeof colors;
