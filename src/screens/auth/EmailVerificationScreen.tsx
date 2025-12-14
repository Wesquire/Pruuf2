/**
 * Email Verification Screen
 * User enters their email address and receives a verification link
 * Replaces SMS verification for Contact onboarding
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Feather as Icon} from '@expo/vector-icons';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';
import {useAppDispatch, useAppSelector} from '../../store';
import {
  sendEmailVerification,
  checkEmailVerificationStatus,
} from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerification'>;

const EmailVerificationScreen: React.FC<Props> = ({navigation, route}) => {
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Poll for verification status when email sent
  useEffect(() => {
    if (!emailSent) {
      return;
    }

    const pollInterval = setInterval(async () => {
      setCheckingStatus(true);
      const result = await dispatch(checkEmailVerificationStatus(email));
      setCheckingStatus(false);

      if (checkEmailVerificationStatus.fulfilled.match(result)) {
        if (result.payload.verified && result.payload.session_token) {
          // Email verified! Navigate to next step
          clearInterval(pollInterval);
          navigation.navigate('CreatePin', {
            email,
            sessionToken: result.payload.session_token,
          });
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [emailSent, email, dispatch, navigation]);

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSendVerification = async () => {
    if (!validateEmail(email)) {
      return;
    }

    const result = await dispatch(sendEmailVerification(email));

    if (sendEmailVerification.fulfilled.match(result)) {
      setEmailSent(true);
      setResendTimer(60); // 60 second cooldown
      Alert.alert(
        'Verification Email Sent',
        `We sent a verification link to ${email}. Click the link in the email to continue.`,
        [{text: 'OK'}],
      );
    } else {
      Alert.alert(
        'Error',
        error || 'Failed to send verification email. Please try again.',
        [{text: 'OK'}],
      );
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) {
      return;
    }
    await handleSendVerification();
  };

  const handleChangeEmail = () => {
    setEmailSent(false);
    setEmail('');
    setEmailError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 1 of 6</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!emailSent ? (
          <>
            <Text style={styles.headline}>What's your email address?</Text>
            <Text style={styles.subheadline}>
              We'll send you a verification link
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={[
                  styles.input,
                  emailError ? styles.inputError : undefined,
                ]}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (emailError) {
                    validateEmail(text);
                  }
                }}
                onBlur={() => validateEmail(email)}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!isLoading}
                accessible={true}
                accessibilityLabel="Email address input"
                accessibilityHint="Enter your email address to receive a verification link"
                testID="email-input"
              />
              {emailError && (
                <View style={styles.errorContainer}>
                  <Icon name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              )}
            </View>

            <Text style={styles.helperText}>
              We'll use this email to send you important alerts and updates
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                !email || emailError || isLoading
                  ? styles.buttonDisabled
                  : undefined,
              ]}
              onPress={handleSendVerification}
              disabled={!email || !!emailError || isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              testID="continue-button">
              {isLoading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Icon name="mail" size={64} color={colors.primary} />
            </View>

            <Text style={styles.headline}>Check your email</Text>
            <Text style={styles.subheadline}>
              We sent a verification link to:
            </Text>

            <View style={styles.emailBadge}>
              <Text style={styles.emailBadgeText}>{email}</Text>
              <TouchableOpacity
                onPress={handleChangeEmail}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Change email">
                <Text style={styles.editLink}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.instructionsBox}>
              <View style={styles.instructionRow}>
                <Icon name="check-circle" size={20} color={colors.primary} />
                <Text style={styles.instructionText}>
                  Open the email from Pruuf
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Icon name="check-circle" size={20} color={colors.primary} />
                <Text style={styles.instructionText}>
                  Click the "Verify Email" button
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Icon name="check-circle" size={20} color={colors.primary} />
                <Text style={styles.instructionText}>
                  Come back to this screen
                </Text>
              </View>
            </View>

            {checkingStatus && (
              <View style={styles.statusContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.statusText}>
                  Checking verification status...
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleResend}
              disabled={resendTimer > 0}
              style={styles.resendLink}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                resendTimer > 0
                  ? `Resend email in ${resendTimer} seconds`
                  : 'Resend email'
              }>
              <Text
                style={[
                  styles.resendText,
                  resendTimer > 0 && styles.resendDisabled,
                ]}>
                {resendTimer > 0
                  ? `Resend in 0:${resendTimer.toString().padStart(2, '0')}`
                  : "Didn't receive the email? Resend"}
              </Text>
            </TouchableOpacity>

            <View style={styles.helpBox}>
              <Icon name="info" size={16} color={colors.textSecondary} />
              <Text style={styles.helpText}>
                Check your spam folder if you don't see the email within a few
                minutes
              </Text>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    padding: spacing.sm,
  },
  progress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  headline: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  button: {
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: colors.textDisabled,
  },
  buttonText: {
    ...typography.button,
    color: colors.background,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundGray,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  emailBadgeText: {
    ...typography.h3,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  editLink: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  statusText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  resendText: {
    ...typography.body,
    color: colors.accent,
  },
  resendDisabled: {
    color: colors.textSecondary,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundGray,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default EmailVerificationScreen;
