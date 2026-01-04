/**
 * Navigation Service
 * Provides navigation access from outside React components
 * Used for notification-based navigation
 */

import {NavigationContainerRef, CommonActions} from '@react-navigation/native';
import {RootStackParamList} from '../types';

// Store navigation ref for use outside components
let navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>> | null =
  null;

/**
 * Set the navigation ref (called from App.tsx)
 */
export function setNavigationRef(
  ref: React.RefObject<NavigationContainerRef<RootStackParamList>>,
): void {
  navigationRef = ref;
}

/**
 * Check if navigation is ready
 */
export function isNavigationReady(): boolean {
  return navigationRef?.current?.isReady() ?? false;
}

/**
 * Navigate to a screen
 */
export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName],
): void {
  if (!navigationRef?.current?.isReady()) {
    console.warn('Navigation not ready, cannot navigate to:', name);
    return;
  }

  navigationRef.current.navigate(name as string, params);
}

/**
 * Navigate to member detail screen
 */
export function navigateToMemberDetail(memberId: string): void {
  navigate('MemberDetail', {memberId});
}

/**
 * Navigate to member dashboard (check-in screen)
 */
export function navigateToMemberDashboard(): void {
  if (!navigationRef?.current?.isReady()) {
    console.warn('Navigation not ready, cannot navigate to MemberDashboard');
    return;
  }

  // Navigate to MainTabs and then to MemberDashboard tab
  navigationRef.current.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{name: 'MainTabs'}],
    }),
  );
}

/**
 * Navigate to enter invite code screen
 */
export function navigateToEnterInviteCode(inviteCode?: string): void {
  navigate('EnterInviteCode', inviteCode ? {inviteCode} : undefined);
}

/**
 * Navigate to notification settings
 */
export function navigateToNotificationSettings(): void {
  navigate('NotificationSettings');
}

/**
 * Navigate to check-in history
 */
export function navigateToCheckInHistory(memberId?: string): void {
  navigate('CheckInHistory', memberId ? {memberId} : undefined);
}

/**
 * Handle notification navigation based on notification type
 */
export function handleNotificationNavigation(data: {
  type?: string;
  member_id?: string;
  invite_code?: string;
  [key: string]: string | undefined;
}): void {
  console.log('Handling notification navigation with data:', data);

  if (!isNavigationReady()) {
    console.warn('Navigation not ready for notification');
    return;
  }

  switch (data.type) {
    case 'missed_checkin':
    case 'MISSED_CHECK_IN':
      if (data.member_id) {
        navigateToMemberDetail(data.member_id);
      }
      break;

    case 'reminder':
    case 'CHECK_IN_REMINDER':
      navigateToMemberDashboard();
      break;

    case 'late_checkin':
    case 'LATE_CHECK_IN':
      if (data.member_id) {
        navigateToMemberDetail(data.member_id);
      }
      break;

    case 'invitation':
    case 'INVITATION':
      navigateToEnterInviteCode(data.invite_code);
      break;

    default:
      console.log('Unknown notification type:', data.type);
      // Default: navigate to main tabs
      navigateToMemberDashboard();
  }
}
