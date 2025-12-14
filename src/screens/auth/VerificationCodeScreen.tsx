/**
 * Verification Code Screen
 * User enters the SMS code received
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather as Icon } from '@expo/vector-icons';
import { CodeInput } from '../../components/common';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store';
import { verifyCode, sendVerificationCode } from '../../store/slices/authSlice';
import { formatPhoneDisplay } from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'VerificationCode'>;

const VerificationCodeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);

  const [code, setCode] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [sessionToken, setSessionToken] = useState('');

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  const handleVerify = async () => {
    const result = await dispatch(verifyCode({ phone, code }));

    if (verifyCode.fulfilled.match(result)) {
      const token = result.payload.session_token!;
      setSessionToken(token);
      navigation.navigate('CreatePin', { phone, sessionToken: token });
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    await dispatch(sendVerificationCode(phone));
    setResendTimer(30);
    setCode('');
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
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 2 of 6</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Enter the code we sent to</Text>
        <View style={styles.phoneRow}>
          <Text style={styles.phone}>{formatPhoneDisplay(phone)}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Edit phone number"
          >
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.codeContainer}>
          <CodeInput
            length={6}
            value={code}
            onChange={setCode}
            error={!!error}
            testID="verification-code-input"
          />

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleResend}
          disabled={resendTimer > 0}
          style={styles.resendLink}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            resendTimer > 0
              ? `Resend code in ${resendTimer} seconds`
              : 'Resend code'
          }
        >
          <Text
            style={[
              styles.resendText,
              resendTimer > 0 && styles.resendDisabled,
            ]}
          >
            {resendTimer > 0
              ? `Resend in 0:${resendTimer.toString().padStart(2, '0')}`
              : "Didn't receive code? Resend"}
          </Text>
        </TouchableOpacity>
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
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  phone: {
    ...typography.h3,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  editLink: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '600',
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
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
});

export default VerificationCodeScreen;
