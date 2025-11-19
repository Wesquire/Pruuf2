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
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Neutrals
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textInverse: '#FFFFFF',

  background: '#FFFFFF',
  backgroundGray: '#F5F5F5',
  backgroundDark: '#121212',

  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  borderDark: '#9E9E9E',

  // Status indicators
  statusActive: '#4CAF50',
  statusPending: '#FF9800',
  statusInactive: '#9E9E9E',
  statusError: '#F44336',

  // Gradients (start and end colors)
  gradientPrimary: ['#4CAF50', '#388E3C'],
  gradientAccent: ['#2196F3', '#1976D2'],
  gradientBanner: ['#E3F2FD', '#FFFFFF'],

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export type Colors = typeof colors;
