/**
 * Payment Settings Screen
 * Manage subscription and payment methods
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types';
import {SubscriptionCard} from '../../components/subscription/SubscriptionCard';
import {colors, spacing, typography} from '../../theme';
import {useAppSelector} from '../../store';
import {paymentsAPI} from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSettings'>;

export const PaymentSettingsScreen: React.FC<Props> = ({navigation}) => {
  const user = useAppSelector(state => state.auth.user);
  const [loading, setLoading] = useState(false);

  if (!user) {
    return null;
  }

  const handleManagePayment = () => {
    navigation.navigate('AddPayment');
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to Pruuf at the end of your billing period.',
      [
        {
          text: 'Keep Subscription',
          style: 'cancel',
        },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: confirmCancelSubscription,
        },
      ],
    );
  };

  const confirmCancelSubscription = async () => {
    setLoading(true);

    try {
      await paymentsAPI.cancelSubscription();

      Alert.alert(
        'Subscription Canceled',
        'Your subscription has been canceled. You will retain access until the end of your current billing period.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh user data
              navigation.goBack();
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to cancel subscription',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Subscription</Text>
          <Text style={styles.subtitle}>
            Manage your Pruuf subscription and payment details
          </Text>
        </View>

        {/* Subscription Card */}
        <SubscriptionCard
          accountStatus={user.account_status as any}
          trialEndsAt={user.trial_end_date}
          subscriptionEndsAt={undefined}
          lastFourDigits={undefined}
          onManagePayment={handleManagePayment}
          onCancelSubscription={handleCancelSubscription}
        />

        {/* Pricing Info */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <View style={styles.pricingCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Monthly subscription</Text>
              <Text style={styles.priceAmount}>$4.99/month</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Annual subscription</Text>
              <Text style={styles.priceAmount}>$50/year</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Free trial</Text>
              <Text style={styles.priceAmount}>30 days</Text>
            </View>
          </View>
        </View>

        {/* What's Included */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>
                Daily check-in monitoring for unlimited members
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>
                SMS alerts when check-ins are missed
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>Push notifications</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>
                Customizable check-in times and timezones
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>✓</Text>
              <Text style={styles.featureText}>24/7 customer support</Text>
            </View>
          </View>
        </View>

        {/* Grandfathered Status */}
        {user.grandfathered_free && (
          <View style={styles.grandfatheredNotice}>
            <Text style={styles.grandfatheredText}>
              🎉 You have lifetime free access to Pruuf!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  pricingSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  pricingCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  priceLabel: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  priceAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  featuresSection: {
    marginTop: spacing.xl,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: typography.sizes.md,
    color: colors.success,
    marginRight: spacing.sm,
    width: 24,
  },
  featureText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  grandfatheredNotice: {
    backgroundColor: colors.success + '10',
    padding: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  grandfatheredText: {
    fontSize: typography.sizes.md,
    color: colors.success,
    textAlign: 'center',
    fontWeight: typography.weights.semibold as any,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaymentSettingsScreen;
