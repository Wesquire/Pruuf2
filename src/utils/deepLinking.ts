/**
 * Deep Linking Utilities
 *
 * Handles deep link URL parsing and navigation for:
 * - Magic link invitations (pruuf://invite/{code})
 * - Email verification links (pruuf://verify-email/{code})
 * - Direct check-in links (pruuf://check-in)
 */

import { Linking } from 'react-native';

/**
 * Deep link URL schemes
 */
export const DEEP_LINK_SCHEMES = {
  APP: 'pruuf://',           // App scheme for deep links
  WEB: 'https://pruuf.me/',  // Web scheme (redirects to app or app store)
};

/**
 * Deep link paths
 */
export const DEEP_LINK_PATHS = {
  INVITE: 'invite',
  VERIFY_EMAIL: 'verify-email',
  CHECK_IN: 'check-in',
  MEMBER_DETAIL: 'member',
  SETTINGS: 'settings',
};

/**
 * Parse deep link URL into components
 */
export interface DeepLinkData {
  scheme: string;      // 'pruuf' or 'https'
  host: string;        // 'pruuf.me' for web links
  path: string;        // 'invite', 'verify-email', etc.
  params: string[];    // Path segments after main path
  queryParams: Record<string, string>; // Query string parameters
}

export function parseDeepLink(url: string): DeepLinkData | null {
  if (!url) return null;

  try {
    // Handle app scheme: pruuf://invite/ABC123
    if (url.startsWith(DEEP_LINK_SCHEMES.APP)) {
      const withoutScheme = url.replace(DEEP_LINK_SCHEMES.APP, '');
      const [pathWithParams, queryString] = withoutScheme.split('?');
      const segments = pathWithParams.split('/').filter(s => s.length > 0);

      return {
        scheme: 'pruuf',
        host: '',
        path: segments[0] || '',
        params: segments.slice(1),
        queryParams: parseQueryString(queryString),
      };
    }

    // Handle web scheme: https://pruuf.me/invite/ABC123
    if (url.startsWith(DEEP_LINK_SCHEMES.WEB)) {
      const withoutScheme = url.replace(DEEP_LINK_SCHEMES.WEB, '');
      const [pathWithParams, queryString] = withoutScheme.split('?');
      const segments = pathWithParams.split('/').filter(s => s.length > 0);

      return {
        scheme: 'https',
        host: 'pruuf.me',
        path: segments[0] || '',
        params: segments.slice(1),
        queryParams: parseQueryString(queryString),
      };
    }

    // Unknown scheme
    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Parse query string into object
 */
function parseQueryString(queryString?: string): Record<string, string> {
  if (!queryString) return {};

  const params: Record<string, string> = {};
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }

  return params;
}

/**
 * Generate deep link URL
 */
export function generateDeepLink(
  path: string,
  params?: string[],
  queryParams?: Record<string, string>
): string {
  let url = `${DEEP_LINK_SCHEMES.APP}${path}`;

  // Add path parameters
  if (params && params.length > 0) {
    url += '/' + params.join('/');
  }

  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += '?' + queryString;
  }

  return url;
}

/**
 * Generate web-based deep link (for emails, falls back to app store if app not installed)
 */
export function generateWebDeepLink(
  path: string,
  params?: string[],
  queryParams?: Record<string, string>
): string {
  let url = `${DEEP_LINK_SCHEMES.WEB}${path}`;

  if (params && params.length > 0) {
    url += '/' + params.join('/');
  }

  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += '?' + queryString;
  }

  return url;
}

/**
 * Handle invitation deep link
 */
export interface InvitationDeepLink {
  type: 'invitation';
  inviteCode: string;
}

export function parseInvitationLink(deepLinkData: DeepLinkData): InvitationDeepLink | null {
  if (deepLinkData.path !== DEEP_LINK_PATHS.INVITE) {
    return null;
  }

  const inviteCode = deepLinkData.params[0];
  if (!inviteCode || !/^[A-Z0-9]{6}$/.test(inviteCode)) {
    return null;
  }

  return {
    type: 'invitation',
    inviteCode,
  };
}

/**
 * Handle email verification deep link
 */
export interface EmailVerificationDeepLink {
  type: 'email_verification';
  verificationCode: string;
}

export function parseEmailVerificationLink(
  deepLinkData: DeepLinkData
): EmailVerificationDeepLink | null {
  if (deepLinkData.path !== DEEP_LINK_PATHS.VERIFY_EMAIL) {
    return null;
  }

  const verificationCode = deepLinkData.params[0];
  if (!verificationCode || !/^[A-Z0-9]{6}$/.test(verificationCode)) {
    return null;
  }

  return {
    type: 'email_verification',
    verificationCode,
  };
}

/**
 * Check if app can handle deep link (installed)
 */
export async function canHandleDeepLink(url: string): Promise<boolean> {
  try {
    return await Linking.canOpenURL(url);
  } catch (error) {
    console.error('Error checking deep link support:', error);
    return false;
  }
}

/**
 * Open deep link in app
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
 * Get initial deep link URL (app opened via deep link)
 */
export async function getInitialDeepLink(): Promise<string | null> {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
}

/**
 * Listen for deep link events
 */
export type DeepLinkListener = (url: string) => void;

export function addDeepLinkListener(listener: DeepLinkListener): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    listener(url);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Generate invitation magic link for email
 */
export function generateInvitationMagicLink(inviteCode: string): string {
  return generateWebDeepLink(DEEP_LINK_PATHS.INVITE, [inviteCode]);
}

/**
 * Generate email verification magic link
 */
export function generateEmailVerificationMagicLink(verificationCode: string): string {
  return generateWebDeepLink(DEEP_LINK_PATHS.VERIFY_EMAIL, [verificationCode]);
}

/**
 * Validate invitation code format
 */
export function isValidInviteCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

/**
 * Validate email verification code format
 */
export function isValidVerificationCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}
