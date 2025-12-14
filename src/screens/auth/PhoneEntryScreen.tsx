/**
 * Phone Entry Screen
 * User enters their phone number for verification
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
import {formatPhoneDisplay} from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;

const PhoneEntryScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Format phone number as user types
  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = '(' + cleaned.substring(0, 3);
    }
    if (cleaned.length > 3) {
      formatted += ') ' + cleaned.substring(3, 6);
    }
    if (cleaned.length > 6) {
      formatted += '-' + cleaned.substring(6, 10);
    }

    setPhone(formatted);
    setPhoneError('');
  };

  // Validate phone number
  const validatePhone = (): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  // Handle continue button press
  const handleContinue = async () => {
    if (!validatePhone()) {
      return;
    }

    const result = await dispatch(sendVerificationCode(phone));

    if (sendVerificationCode.fulfilled.match(result)) {
      navigation.navigate('VerificationCode', {phone});
    } else {
      const errorMessage = result.payload as string;
      if (errorMessage.includes('already registered')) {
        Alert.alert(
          'Account Exists',
          'This phone number is already registered. Would you like to log in instead?',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Log In', onPress: () => navigation.navigate('PhoneEntry')},
          ],
        );
      }
    }
  };

  const isValid = phone.replace(/\D/g, '').length === 10;

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
          <Text style={styles.headline}>What's your phone number?</Text>
          <Text style={styles.subheadline}>
            We'll send you a verification code
          </Text>

          <TextInput
            label="Phone number"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            error={phoneError || (error && !phoneError ? error : undefined)}
            testID="phone-input"
          />

          <Text style={styles.helperText}>Standard SMS rates may apply</Text>
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
            accessibilityHint="Send verification code to your phone"
            testID="phone-continue-button"
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
