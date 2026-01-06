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
  Image,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({navigation}) => {
  return (
    <SafeAreaView
      style={styles.container}
      accessible={true}
      accessibilityLabel="Pruuf welcome screen. Tap Get Started to begin.">
      <View style={styles.content}>
        {/* Hero section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            accessibilityLabel="Pruuf logo"
            resizeMode="contain"
          />
          <Text style={styles.appName}>Pruuf</Text>
          <Text style={styles.headline}>
            The daily tap that means everything.
          </Text>
          <Text style={styles.subheadline}>
            Stay close to loved ones, no matter the distance.
          </Text>
        </View>

        {/* CTA section */}
        <View style={styles.ctaSection}>
          <Button
            title="Get Started"
            onPress={() => navigation.navigate('EmailEntry')}
            variant="primary"
            size="large"
            fullWidth={true}
            accessibilityHint="Navigate to email entry"
            testID="welcome-get-started-button"
          />

          <TouchableOpacity
            onPress={() => {
              // TODO: Navigate to login flow
              navigation.navigate('EmailEntry');
            }}
            style={styles.loginLink}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Already have an account? Log in">
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginBold}>Log in</Text>
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
    width: 150,
    height: 150,
    marginBottom: spacing.sm,
  },
  appName: {
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
    fontSize: 17,
    lineHeight: 24,
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
