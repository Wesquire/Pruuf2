/**
 * Deep Link Handler Component
 * Handles all deep link navigation for magic links (invitations, email verification)
 *
 * Supported deep link patterns:
 * - pruuf://invite/ABC123 (Member invitation)
 * - pruuf://verify-email/CODE123 (Email verification)
 * - pruuf://check-in (Navigate to check-in / main app)
 * - pruuf://member/:memberId (View member detail)
 * - pruuf://settings (Navigate to settings)
 * - pruuf://settings/payment (Navigate to payment settings)
 */

import {useEffect, useRef} from 'react';
import {Linking, Alert, AppState, AppStateStatus} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {useAppSelector} from '../store';
import {membersAPI} from '../services/api';
import {
  parseDeepLink,
  parseInvitationLink,
  parseEmailVerificationLink,
  DEEP_LINK_PATHS,
} from '../utils/deepLinking';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DeepLinkHandler = () => {
  const navigation = useNavigation<NavigationProp>();
  const {user, isLoggedIn} = useAppSelector(state => state.auth);
  const appState = useRef(AppState.currentState);
  const processingLink = useRef(false);

  /**
   * Process deep link URL
   */
  const processDeepLink = async (url: string) => {
    // Prevent duplicate processing
    if (processingLink.current) {
      console.log('[DeepLink] Already processing a link, skipping:', url);
      return;
    }

    processingLink.current = true;

    try {
      console.log('[DeepLink] Processing URL:', url);

      // Parse the deep link
      const parsed = parseDeepLink(url);
      if (!parsed) {
        console.warn('[DeepLink] Failed to parse URL:', url);
        processingLink.current = false;
        return;
      }

      const {path, params} = parsed;
      console.log('[DeepLink] Parsed path:', path, 'params:', params);

      // Handle different paths
      switch (path) {
        case DEEP_LINK_PATHS.INVITE: {
          // Member invitation link - pruuf://invite/ABC123
          const invitationData = parseInvitationLink(parsed);
          if (!invitationData) {
            Alert.alert('Invalid Link', 'This invitation link is invalid.');
            break;
          }

          const inviteCode = invitationData.inviteCode;
          console.log('[DeepLink] Processing invitation code:', inviteCode);

          // If user is not authenticated, save code for after login
          if (!isLoggedIn) {
            // Store pending invitation and navigate to welcome
            navigation.navigate('Welcome', {inviteCode});
            break;
          }

          // User is authenticated, attempt to accept invitation via API
          try {
            const response = await membersAPI.acceptInvite(inviteCode);

            if (response.success) {
              Alert.alert(
                'Invitation Accepted',
                "You're now connected! Your contacts will receive alerts when you check in.",
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Navigate to main tabs (will show appropriate dashboard based on user role)
                      navigation.reset({
                        index: 0,
                        routes: [{name: 'MainTabs'}],
                      });
                    },
                  },
                ],
              );
            } else {
              Alert.alert(
                'Error',
                response.error || 'Failed to accept invitation. Please try again.',
                [{text: 'OK'}],
              );
            }
          } catch (error) {
            console.error('[DeepLink] Error accepting invitation:', error);
            Alert.alert(
              'Error',
              'Failed to accept invitation. Please try again.',
              [{text: 'OK'}],
            );
          }
          break;
        }

        case DEEP_LINK_PATHS.VERIFY_EMAIL: {
          // Email verification link - pruuf://verify-email/CODE123
          const verificationData = parseEmailVerificationLink(parsed);
          if (!verificationData) {
            Alert.alert('Invalid Link', 'This verification link is invalid.');
            break;
          }

          const verificationCode = verificationData.verificationCode;
          console.log('[DeepLink] Processing email verification code');

          // Verification codes are handled via the normal verification flow
          // Navigate to verification screen or handle inline
          try {
            // The verification code would typically be entered on the VerificationCode screen
            // For deep links, we can attempt to verify directly
            Alert.alert(
              'Verification Code',
              `Your verification code is: ${verificationCode}\n\nPlease enter this code on the verification screen.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // If not logged in, go to welcome to start the flow
                    if (!isLoggedIn) {
                      navigation.navigate('Welcome', {});
                    }
                  },
                },
              ],
            );
          } catch (error) {
            console.error('[DeepLink] Error with email verification:', error);
            Alert.alert(
              'Verification Failed',
              'This verification link is invalid or has expired.',
              [{text: 'OK'}],
            );
          }
          break;
        }

        case DEEP_LINK_PATHS.CHECK_IN: {
          // Navigate to main app for check-in - pruuf://check-in
          if (!isLoggedIn) {
            Alert.alert('Not Logged In', 'Please log in to check in.', [
              {text: 'OK'},
            ]);
            break;
          }

          // Navigate to main tabs (MemberDashboard shows check-in button)
          navigation.reset({
            index: 0,
            routes: [{name: 'MainTabs'}],
          });
          break;
        }

        case DEEP_LINK_PATHS.MEMBER_DETAIL: {
          // Navigate to member detail - pruuf://member/:memberId
          const memberId = params[0];
          if (!memberId) {
            Alert.alert('Invalid Link', 'This link is invalid.');
            break;
          }

          if (!isLoggedIn) {
            Alert.alert(
              'Not Logged In',
              'Please log in to view member details.',
              [{text: 'OK'}],
            );
            break;
          }

          navigation.navigate('MemberDetail', {memberId});
          break;
        }

        case DEEP_LINK_PATHS.SETTINGS: {
          // Navigate to settings - pruuf://settings or pruuf://settings/payment
          if (!isLoggedIn) {
            Alert.alert('Not Logged In', 'Please log in to access settings.', [
              {text: 'OK'},
            ]);
            break;
          }

          const subPath = params[0];
          if (subPath === 'payment') {
            navigation.navigate('PaymentSettings');
          } else {
            navigation.navigate('Settings');
          }
          break;
        }

        default:
          console.warn('[DeepLink] Unknown path:', path);
          // Navigate to main app for unknown paths if logged in
          if (isLoggedIn) {
            navigation.reset({
              index: 0,
              routes: [{name: 'MainTabs'}],
            });
          }
          break;
      }
    } catch (error) {
      console.error('[DeepLink] Error processing deep link:', error);
      Alert.alert('Error', 'Failed to process link. Please try again.', [
        {text: 'OK'},
      ]);
    } finally {
      processingLink.current = false;
    }
  };

  /**
   * Handle initial URL (app was closed, opened via deep link)
   */
  useEffect(() => {
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          console.log('[DeepLink] Initial URL:', url);
          processDeepLink(url);
        }
      })
      .catch(error => {
        console.error('[DeepLink] Error getting initial URL:', error);
      });
  }, []);

  /**
   * Handle URL events (app was in background/foreground, opened via deep link)
   */
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[DeepLink] URL event:', url);
      processDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [isLoggedIn, user]);

  /**
   * Handle app state changes (foreground/background)
   * Re-check for deep links when app comes to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[DeepLink] App has come to foreground, checking for pending links');
        // Check if there's a pending deep link
        Linking.getInitialURL()
          .then(url => {
            if (url) {
              console.log('[DeepLink] Found pending URL:', url);
              processDeepLink(url);
            }
          })
          .catch(error => {
            console.error('[DeepLink] Error checking pending URL:', error);
          });
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null; // This is a logic-only component
};

export default DeepLinkHandler;
