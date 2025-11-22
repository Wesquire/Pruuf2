/**
 * Deep Link Utilities
 * Item 36: Implement Deep Link Testing (LOW)
 *
 * Handles deep link parsing and navigation
 */

import { Linking } from 'react-native';

export type DeepLinkRoute =
  | 'home'
  | 'member-dashboard'
  | 'contact-dashboard'
  | 'check-in-history'
  | 'member-settings'
  | 'contact-settings'
  | 'notification-settings'
  | 'payment-settings'
  | 'member-detail'
  | 'contact-detail'
  | 'invite-code';

export interface DeepLinkParams {
  [key: string]: string | undefined;
}

export interface ParsedDeepLink {
  route: DeepLinkRoute | null;
  params: DeepLinkParams;
}

/**
 * Parse a deep link URL
 */
export function parseDeepLink(url: string): ParsedDeepLink {
  try {
    // Handle custom URL scheme (pruuf://)
    if (!url.startsWith('pruuf://')) {
      throw new Error('Invalid deep link scheme');
    }

    // Remove scheme
    const urlWithoutScheme = url.replace('pruuf://', '');

    // Split path and query string
    const [pathPart, queryPart] = urlWithoutScheme.split('?');

    // Parse query string
    const params: DeepLinkParams = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    // Map paths to routes
    const routeMap: Record<string, DeepLinkRoute> = {
      '': 'home',
      home: 'home',
      'member-dashboard': 'member-dashboard',
      'member/dashboard': 'member-dashboard',
      'contact-dashboard': 'contact-dashboard',
      'contact/dashboard': 'contact-dashboard',
      'check-in-history': 'check-in-history',
      'member/settings': 'member-settings',
      'contact/settings': 'contact-settings',
      'settings/notifications': 'notification-settings',
      'settings/payment': 'payment-settings',
      'member/detail': 'member-detail',
      'contact/detail': 'contact-detail',
      'invite': 'invite-code',
    };

    const route = routeMap[pathPart] || null;

    return { route, params };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return { route: null, params: {} };
  }
}

/**
 * Build a deep link URL
 */
export function buildDeepLink(route: DeepLinkRoute, params?: DeepLinkParams): string {
  const baseUrl = 'pruuf://';

  // Map routes to paths
  const pathMap: Record<DeepLinkRoute, string> = {
    home: '',
    'member-dashboard': 'member-dashboard',
    'contact-dashboard': 'contact-dashboard',
    'check-in-history': 'check-in-history',
    'member-settings': 'member/settings',
    'contact-settings': 'contact/settings',
    'notification-settings': 'settings/notifications',
    'payment-settings': 'settings/payment',
    'member-detail': 'member/detail',
    'contact-detail': 'contact/detail',
    'invite-code': 'invite',
  };

  const path = pathMap[route];

  // Build query string
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
  }

  const queryString = queryParams.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Get initial URL (for app launch via deep link)
 */
export async function getInitialURL(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
}

/**
 * Open a deep link URL
 */
export async function openDeepLink(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error opening deep link:', error);
    return false;
  }
}

/**
 * Subscribe to deep link events
 */
export function subscribeToDeepLinks(
  callback: (url: string) => void
): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });

  return () => {
    subscription.remove();
  };
}
