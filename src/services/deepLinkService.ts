/**
 * Deep Link Service
 * Handles deep linking for invite codes and other app flows
 * Supports universal links (iOS) and app links (Android)
 */

import {Linking, Platform} from 'react-native';
import {NavigationContainerRef} from '@react-navigation/native';

// Deep link URL scheme
const URL_SCHEME = 'pruuf://';
const UNIVERSAL_LINK_DOMAIN = 'https://pruuf.me';

/**
 * Initialize deep linking
 */
export function initializeDeepLinking(
  navigationRef: React.RefObject<NavigationContainerRef<any>>,
): () => void {
  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL().then(url => {
    if (url) {
      console.log('App opened with URL:', url);
      handleDeepLink(url, navigationRef);
    }
  });

  // Handle URL changes (deep link while app is running)
  const subscription = Linking.addEventListener('url', event => {
    console.log('Deep link received:', event.url);
    handleDeepLink(event.url, navigationRef);
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

/**
 * Handle a deep link URL
 */
function handleDeepLink(
  url: string,
  navigationRef: React.RefObject<NavigationContainerRef<any>>,
): void {
  // Parse the URL
  const route = parseDeepLink(url);

  if (!route) {
    console.error('Invalid deep link:', url);
    return;
  }

  // Navigate to the appropriate screen
  if (navigationRef.current?.isReady()) {
    switch (route.type) {
      case 'invite':
        navigateToInvite(route.params.code, navigationRef);
        break;

      case 'check-in':
        navigateToCheckIn(navigationRef);
        break;

      case 'settings':
        navigateToSettings(navigationRef);
        break;

      default:
        console.error('Unknown deep link type:', route.type);
    }
  } else {
    // Navigation not ready, queue the action
    console.warn('Navigation not ready for deep link');
  }
}

/**
 * Parse a deep link URL into route information
 */
function parseDeepLink(url: string): DeepLinkRoute | null {
  // Handle both URL scheme and universal links
  let path = '';

  if (url.startsWith(URL_SCHEME)) {
    // URL scheme: pruuf://invite/ABC123
    path = url.replace(URL_SCHEME, '');
  } else if (url.startsWith(UNIVERSAL_LINK_DOMAIN)) {
    // Universal link: https://pruuf.me/invite/ABC123
    path = url.replace(UNIVERSAL_LINK_DOMAIN + '/', '');
  } else {
    return null;
  }

  // Parse path segments
  const segments = path.split('/');

  if (segments[0] === 'invite' && segments[1]) {
    return {
      type: 'invite',
      params: {code: segments[1]},
    };
  }

  if (segments[0] === 'check-in') {
    return {
      type: 'check-in',
      params: {},
    };
  }

  if (segments[0] === 'settings') {
    return {
      type: 'settings',
      params: {},
    };
  }

  return null;
}

/**
 * Navigate to invite screen with code
 */
function navigateToInvite(
  code: string,
  navigationRef: React.RefObject<NavigationContainerRef<any>>,
): void {
  navigationRef.current?.navigate('MemberOnboarding', {
    screen: 'InviteCode',
    params: {inviteCode: code},
  });
}

/**
 * Navigate to check-in screen
 */
function navigateToCheckIn(
  navigationRef: React.RefObject<NavigationContainerRef<any>>,
): void {
  navigationRef.current?.navigate('MemberDashboard');
}

/**
 * Navigate to settings screen
 */
function navigateToSettings(
  navigationRef: React.RefObject<NavigationContainerRef<any>>,
): void {
  navigationRef.current?.navigate('Settings');
}

/**
 * Generate an invite deep link
 */
export function generateInviteLink(inviteCode: string): string {
  if (Platform.OS === 'ios') {
    // Use universal link for iOS
    return `${UNIVERSAL_LINK_DOMAIN}/invite/${inviteCode}`;
  } else {
    // Use app link for Android
    return `${UNIVERSAL_LINK_DOMAIN}/invite/${inviteCode}`;
  }
}

/**
 * Generate a check-in deep link
 */
export function generateCheckInLink(): string {
  return `${URL_SCHEME}check-in`;
}

/**
 * Open a deep link (for testing)
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
 * Check if a URL can be opened
 */
export async function canOpenURL(url: string): Promise<boolean> {
  try {
    return await Linking.canOpenURL(url);
  } catch (error) {
    console.error('Error checking URL:', error);
    return false;
  }
}

// Types
interface DeepLinkRoute {
  type: 'invite' | 'check-in' | 'settings';
  params: Record<string, any>;
}
