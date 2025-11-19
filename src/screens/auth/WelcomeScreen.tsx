/**
 * Welcome Screen
 * First screen users see when opening the app
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <Text style={styles.logo}>Pruuf</Text>
          <Text style={styles.headline}>
            Stay connected to loved ones with daily check-ins
          </Text>
          <Text style={styles.subheadline}>
            30-day free trial • $2.99/month after • Cancel anytime
          </Text>
        </View>

        {/* CTA section */}
        <View style={styles.ctaSection}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('PhoneEntry')}
            variant="primary"
            size="large"
            accessibilityHint="Navigate to phone number entry"
            testID="welcome-get-started-button"
          />

          <TouchableOpacity
            onPress={() => {
              // TODO: Navigate to login flow
              navigation.navigate('PhoneEntry');
            }}
            style={styles.loginLink}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Log in"
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Log in</Text>
            </Text>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  subheadline: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  ctaSection: {
    paddingBottom: spacing.lg,
  },
  loginLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginBold: {
    color: colors.accent,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
