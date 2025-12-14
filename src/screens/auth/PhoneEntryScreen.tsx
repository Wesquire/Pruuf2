/**
 * Phone Entry Screen
 * Legacy screen - now collects email for verification
 * Kept for backwards compatibility
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Feather as Icon} from '@expo/vector-icons';
import {Button, TextInput} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';
import {useAppDispatch, useAppSelector} from '../../store';
import {sendVerificationCode} from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;

const PhoneEntryScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validate email
  const validateEmail = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Handle continue button press
  const handleContinue = async () => {
    if (!validateEmail()) {
      return;
    }

    const result = await dispatch(sendVerificationCode(email));

    if (sendVerificationCode.fulfilled.match(result)) {
      navigation.navigate('VerificationCode', {email});
    } else {
      const errorMessage = result.payload as string;
      if (errorMessage.includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Would you like to log in instead?',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Log In', onPress: () => navigation.navigate('PhoneEntry')},
          ],
        );
      }
    }
  };

  const isValid = email.length > 0 && !emailError;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
          <Text style={styles.headline}>What's your email address?</Text>
          <Text style={styles.subheadline}>
            We'll send you a verification code
          </Text>

          <TextInput
            label="Email address"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              if (emailError) {
                setEmailError('');
              }
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError || (error && !emailError ? error : undefined)}
            testID="email-input"
          />

          <Text style={styles.helperText}>
            We'll use this to verify your account
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            size="large"
            disabled={!isValid}
            loading={isLoading}
            accessibilityHint="Send verification code to your email"
            testID="email-continue-button"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
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
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
  },
});

export default PhoneEntryScreen;
