/**
 * Enter PIN Screen
 * Returning user enters their PIN to log in
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import {CodeInput} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';
import {useAppDispatch, useAppSelector} from '../../store';
import {login, clearError} from '../../store/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'EnterPin'>;

const EnterPinScreen: React.FC<Props> = ({navigation, route}) => {
  const {email} = route.params;
  const dispatch = useAppDispatch();
  const {isLoading, error, isLoggedIn} = useAppSelector(state => state.auth);

  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle successful login - navigate to main app
  useEffect(() => {
    if (isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{name: 'MainTabs'}],
      });
    }
  }, [isLoggedIn, navigation]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error, [
        {
          text: 'Try Again',
          onPress: () => {
            setPin('');
            dispatch(clearError());
          },
        },
      ]);
    }
  }, [error, dispatch]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4 && !isLoading) {
      handleLogin();
    }
  }, [pin]);

  const handleLogin = async () => {
    const result = await dispatch(login({email, pin}));

    if (login.rejected.match(result)) {
      setAttempts(prev => prev + 1);
      setPin('');
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Reset PIN',
      'Would you like to reset your PIN? We\'ll send a verification code to your email.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset PIN',
          onPress: () => {
            // Navigate back to email entry to start reset flow
            navigation.navigate('EmailEntry');
          },
        },
      ],
    );
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
        <Text style={styles.headerTitle}>Welcome Back</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="lock" size={48} color={colors.primary} />
        </View>

        <Text style={styles.headline}>Enter your PIN</Text>
        <Text style={styles.subheadline}>
          Sign in to continue to Pruuf
        </Text>

        <View style={styles.codeContainer}>
          <CodeInput
            length={4}
            value={pin}
            onChange={setPin}
            secureTextEntry={true}
            error={!!error}
            testID="enter-pin-input"
          />

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Signing in...</Text>
            </View>
          )}

          {attempts > 0 && !isLoading && (
            <Text style={styles.attemptsText}>
              {5 - attempts > 0
                ? `${5 - attempts} attempts remaining`
                : 'Account may be locked'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleForgotPin}
          style={styles.forgotLink}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Forgot PIN">
          <Text style={styles.forgotText}>Forgot your PIN?</Text>
        </TouchableOpacity>

        <View style={styles.emailInfo}>
          <Text style={styles.emailLabel}>Signing in as</Text>
          <Text style={styles.emailValue}>{email}</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Use different email">
            <Text style={styles.changeEmailLink}>Use different email</Text>
          </TouchableOpacity>
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
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  attemptsText: {
    ...typography.bodySmall,
    color: colors.warning,
    marginTop: spacing.md,
  },
  forgotLink: {
    paddingVertical: spacing.md,
  },
  forgotText: {
    ...typography.body,
    color: colors.accent,
  },
  emailInfo: {
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    width: '100%',
  },
  emailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  changeEmailLink: {
    ...typography.bodySmall,
    color: colors.accent,
  },
});

export default EnterPinScreen;
