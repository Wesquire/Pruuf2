/**
 * Trial Welcome Screen
 * Welcomes Contact user and explains trial
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Button } from '../../components/common';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TrialWelcome'>;

const benefits = [
  'Monitor unlimited loved ones',
  'Get instant alerts if they miss check-ins',
  'No credit card required during trial',
  '$3.99/month after trial. Cancel anytime.',
];

const TrialWelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={80} color={colors.success} />
        </View>

        <Text style={styles.headline}>
          Your 30-day free trial starts now!
        </Text>

        {/* Benefits */}
        <View style={styles.benefits}>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Icon name="check" size={20} color={colors.primary} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          <Button
            title="Add Your First Member"
            onPress={() => navigation.navigate('AddMember')}
            variant="primary"
            size="large"
            testID="trial-welcome-add-member-button"
          />

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  benefits: {
    marginBottom: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  footer: {
    marginTop: spacing.xl,
  },
  termsText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default TrialWelcomeScreen;
