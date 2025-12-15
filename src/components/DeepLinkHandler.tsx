/**
 * Deep Link Handler Component
 * Handles all deep link navigation for magic links (invitations, email verification)
 *
 * Supported deep link patterns:
 * - pruuf://invite?code=ABC123 (Member invitation)
 * - pruuf://verify-email?token=xyz... (Email verification)
 * - pruuf://members (Navigate to members list)
 * - pruuf://settings/payment (Navigate to payment settings)
 */

import { useEffect, useRef } from 'react';
import { Linking, Alert, AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppDispatch, useAppSelector } from '../store';
import { acceptInvitation, verifyEmailWithToken } from '../store/slices/authSlice';
import { handleDeepLink, parseDeepLink } from '../utils/deepLinking';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DeepLinkHandler = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
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

      const { route, params } = parsed;
      console.log('[DeepLink] Parsed route:', route, 'params:', params);

      // Handle different routes
      switch (route) {
        case 'invite': {
          // Member invitation link
          const inviteCode = params.code;
          if (!inviteCode) {
            Alert.alert('Invalid Link', 'This invitation link is invalid.');
            break;
          }

          console.log('[DeepLink] Processing invitation code:', inviteCode);

          // If user is not authenticated, save code for after login
          if (!isAuthenticated) {
            // Store pending invitation
            navigation.navigate('Welcome', { inviteCode });
            break;
          }

          // User is authenticated, accept invitation
          const result = await dispatch(acceptInvitation(inviteCode));

          if (acceptInvitation.fulfilled.match(result)) {
            Alert.alert(
              'Invitation Accepted',
              `You're now connected! Your contacts will receive alerts when you check in.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to member dashboard
                    navigation.navigate('MemberDashboard');
                  },
                },
              ]
            );
          } else {
            const errorMessage = result.payload as string;
            Alert.alert(
              'Error',
              errorMessage || 'Failed to accept invitation. Please try again.',
              [{ text: 'OK' }]
            );
          }
          break;
        }

        case 'verify-email': {
          // Email verification link
          const token = params.token;
          if (!token) {
            Alert.alert('Invalid Link', 'This verification link is invalid.');
            break;
          }

          console.log('[DeepLink] Processing email verification token');

          const result = await dispatch(verifyEmailWithToken(token));

          if (verifyEmailWithToken.fulfilled.match(result)) {
            // Email verified successfully
            const { session_token, email } = result.payload;

            Alert.alert(
              'Email Verified',
              'Your email has been verified successfully!',
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    // Navigate to create PIN
                    navigation.navigate('CreatePin', {
                      email,
                      sessionToken: session_token,
                    });
                  },
                },
              ]
            );
          } else {
            const errorMessage = result.payload as string;
            Alert.alert(
              'Verification Failed',
              errorMessage || 'This verification link is invalid or has expired.',
              [{ text: 'OK' }]
            );
          }
          break;
        }

        case 'members': {
          // Navigate to members list
          if (!isAuthenticated) {
            Alert.alert(
              'Not Logged In',
              'Please log in to view your members.',
              [{ text: 'OK' }]
            );
            break;
          }

          navigation.navigate('ContactDashboard');
          break;
        }

        case 'settings': {
          // Navigate to settings (with optional sub-path)
          if (!isAuthenticated) {
            Alert.alert(
              'Not Logged In',
              'Please log in to access settings.',
              [{ text: 'OK' }]
            );
            break;
          }

          const subPath = params.path;
          if (subPath === 'payment') {
            navigation.navigate('PaymentSettings');
          } else {
            navigation.navigate('Settings');
          }
          break;
        }

        default:
          console.warn('[DeepLink] Unknown route:', route);
          break;
      }
    } catch (error) {
      console.error('[DeepLink] Error processing deep link:', error);
      Alert.alert(
        'Error',
        'Failed to process link. Please try again.',
        [{ text: 'OK' }]
      );
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
  }, [isAuthenticated, user]);

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
