/**
 * Confirm PIN Screen
 * User confirms their 4-digit PIN
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Feather as Icon} from '@expo/vector-icons';
import {CodeInput} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';
import {useAppDispatch, useAppSelector} from '../../store';
import {createAccount} from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmPin'>;

const ConfirmPinScreen: React.FC<Props> = ({navigation, route}) => {
  const {phone, sessionToken, pin} = route.params;
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(state => state.auth);

  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Auto-verify when PIN is complete
  useEffect(() => {
    if (confirmPin.length === 4) {
      handleConfirm();
    }
  }, [confirmPin]);

  const handleConfirm = async () => {
    if (confirmPin !== pin) {
      setPinError("PINs don't match. Try again.");
      setConfirmPin('');
      return;
    }

    const result = await dispatch(createAccount({phone, pin, sessionToken}));

    if (createAccount.fulfilled.match(result)) {
      // Navigate to font size selection
      navigation.navigate('FontSize', {isOnboarding: true});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 3 of 6</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Confirm your PIN</Text>
        <Text style={styles.subheadline}>Enter the same 4 digits again</Text>

        <View style={styles.codeContainer}>
          <CodeInput
            length={4}
            value={confirmPin}
            onChange={value => {
              setConfirmPin(value);
              setPinError('');
            }}
            secureTextEntry={true}
            error={!!pinError || !!error}
            testID="confirm-pin-input"
          />

          {(pinError || error) && (
            <Text style={styles.errorText}>{pinError || error}</Text>
          )}
        </View>
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
    alignItems: 'center',
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
    marginBottom: spacing.xxl,
    textAlign: 'center',
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
});

export default ConfirmPinScreen;
