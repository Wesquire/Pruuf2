/**
 * Payment Method Screen - RevenueCat Implementation
 * Displays subscription options and handles purchases via RevenueCat
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
} from 'react-native-purchases';

import {RootStackParamList} from '../../types';
import {Button} from '../../components/common';
import {colors, spacing, typography} from '../../theme';
import {REVENUECAT_CONFIG, PRICING} from '../../constants/config';
import {paymentsAPI} from '../../services/api';
import {useAppDispatch} from '../../store';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPayment'>;

// Package type for display
type SubscriptionPackage = {
  rcPackage: PurchasesPackage;
  identifier: string;
  price: string;
  pricePerMonth: string;
  interval: string;
  description: string;
  savings?: string;
  isPopular?: boolean;
};

export const PaymentMethodScreen: React.FC<Props> = ({navigation}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<SubscriptionPackage | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();

  /**
   * Fetch available offerings from RevenueCat
   */
  const fetchOfferings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Check if user already has active subscription
      if (
        info.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !==
        undefined
      ) {
        // User already subscribed
        Alert.alert(
          'Already Subscribed',
          'You already have an active subscription.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
        return;
      }

      // Fetch offerings
      const availableOfferings = await Purchases.getOfferings();

      if (
        !availableOfferings.current ||
        availableOfferings.current.availablePackages.length === 0
      ) {
        throw new Error('No subscription packages available');
      }

      setOfferings(availableOfferings.current);

      // Parse packages into display format
      const parsedPackages: SubscriptionPackage[] =
        availableOfferings.current.availablePackages
          .map((pkg: PurchasesPackage) => {
            const isMonthly =
              pkg.identifier === REVENUECAT_CONFIG.MONTHLY_PRODUCT_ID ||
              pkg.packageType === Purchases.PACKAGE_TYPE.MONTHLY;
            const isAnnual =
              pkg.identifier === REVENUECAT_CONFIG.ANNUAL_PRODUCT_ID ||
              pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL;

            if (!isMonthly && !isAnnual) {
              return null; // Skip non-subscription packages
            }

            // Get price information
            const price = pkg.product.priceString;
            const pricePerMonth = isAnnual
              ? `$${(pkg.product.price / 12).toFixed(2)}/mo`
              : price;

            // Calculate savings for annual
            let savings: string | undefined;
            if (isAnnual) {
              const monthlyEquivalent = PRICING.MONTHLY.price * 12;
              const annualPrice = pkg.product.price;
              const savedAmount = monthlyEquivalent - annualPrice;
              if (savedAmount > 0) {
                savings = `Save $${savedAmount.toFixed(2)}/year`;
              }
            }

            return {
              rcPackage: pkg,
              identifier: pkg.identifier,
              price,
              pricePerMonth,
              interval: isMonthly ? 'month' : 'year',
              description: isMonthly
                ? PRICING.MONTHLY.description
                : PRICING.ANNUAL.description,
              savings,
              isPopular: isAnnual, // Mark annual as popular
            };
          })
          .filter(Boolean) as SubscriptionPackage[];

      setPackages(parsedPackages);

      // Select monthly by default
      const monthlyPackage = parsedPackages.find(
        p => p.interval === 'month',
      );
      if (monthlyPackage) {
        setSelectedPackage(monthlyPackage);
      }
    } catch (err: any) {
      console.error('Error fetching offerings:', err);
      setError(
        err.message || 'Failed to load subscription options. Please try again.',
      );
      Alert.alert(
        'Error',
        'Failed to load subscription options. Please check your internet connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  /**
   * Purchase selected package
   */
  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setPurchasing(true);

    try {
      // Make the purchase
      const {customerInfo: purchaseInfo, productIdentifier} =
        await Purchases.purchasePackage(selectedPackage.rcPackage);

      console.log('Purchase successful:', productIdentifier);

      // Check if purchase granted entitlement
      if (
        purchaseInfo.entitlements.active[
          REVENUECAT_CONFIG.ENTITLEMENT_ID
        ] !== undefined
      ) {
        // Success! User now has active subscription
        // Send purchase info to backend
        try {
          await paymentsAPI.syncRevenueCatPurchase({
            customer_id: purchaseInfo.originalAppUserId,
            product_id: productIdentifier,
            entitlement_id: REVENUECAT_CONFIG.ENTITLEMENT_ID,
          });
        } catch (syncError) {
          console.error('Failed to sync purchase with backend:', syncError);
          // Don't block the user - subscription is active in RevenueCat
        }

        Alert.alert(
          'Success!',
          `Your ${selectedPackage.interval}ly subscription is now active. Thank you for subscribing!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        // Purchase completed but no entitlement (shouldn't happen)
        throw new Error('Purchase completed but subscription not activated');
      }
    } catch (err: any) {
      console.error('Purchase error:', err);

      // Handle specific error types
      if ((err as PurchasesError).userCancelled) {
        // User cancelled, do nothing
        console.log('User cancelled purchase');
      } else if ((err as PurchasesError).code === 'PRODUCT_ALREADY_PURCHASED') {
        Alert.alert(
          'Already Subscribed',
          'You already have an active subscription.',
        );
      } else if ((err as PurchasesError).code === 'PAYMENT_PENDING') {
        Alert.alert(
          'Payment Pending',
          'Your payment is being processed. This may take a few moments.',
        );
      } else {
        // Generic error
        Alert.alert(
          'Purchase Failed',
          err.message || 'Unable to complete purchase. Please try again.',
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  /**
   * Restore previous purchases
   */
  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const info = await Purchases.restorePurchases();

      if (
        info.entitlements.active[REVENUECAT_CONFIG.ENTITLEMENT_ID] !==
        undefined
      ) {
        Alert.alert(
          'Restored!',
          'Your subscription has been restored successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any previous purchases to restore.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Restore Failed',
        err.message || 'Unable to restore purchases. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open privacy policy
   */
  const openPrivacyPolicy = () => {
    Linking.openURL('https://pruuf.me/privacy');
  };

  /**
   * Open terms of service
   */
  const openTermsOfService = () => {
    Linking.openURL('https://pruuf.me/terms');
  };

  // Load offerings on mount
  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  /**
   * Render loading state
   */
  if (loading && packages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error && packages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          onPress={fetchOfferings}
          style={styles.retryButton}
        />
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
        />
      </View>
    );
  }

  /**
   * Render main content
   */
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Monitor unlimited loved ones with daily check-ins
          </Text>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>
            🔒 Secured by {Platform.OS === 'ios' ? 'Apple' : 'Google'}. Cancel
            anytime.
          </Text>
        </View>

        {/* Subscription Packages */}
        <View style={styles.packagesContainer}>
          {packages.map(pkg => (
            <TouchableOpacity
              key={pkg.identifier}
              style={[
                styles.packageCard,
                selectedPackage?.identifier === pkg.identifier &&
                  styles.packageCardSelected,
                pkg.isPopular && styles.packageCardPopular,
              ]}
              onPress={() => setSelectedPackage(pkg)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${pkg.interval}ly subscription, ${pkg.price}`}
              accessibilityState={{selected: selectedPackage === pkg}}>
              {/* Popular Badge */}
              {pkg.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
              )}

              {/* Selection Indicator */}
              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radio,
                    selectedPackage?.identifier === pkg.identifier &&
                      styles.radioSelected,
                  ]}>
                  {selectedPackage?.identifier === pkg.identifier && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </View>

              {/* Package Info */}
              <View style={styles.packageInfo}>
                <Text style={styles.packageInterval}>
                  {pkg.interval === 'month' ? 'Monthly' : 'Annual'}
                </Text>
                <Text style={styles.packagePrice}>{pkg.price}</Text>
                {pkg.interval === 'year' && (
                  <Text style={styles.packagePricePerMonth}>
                    {pkg.pricePerMonth}
                  </Text>
                )}
                <Text style={styles.packageDescription}>{pkg.description}</Text>
                {pkg.savings && (
                  <Text style={styles.packageSavings}>{pkg.savings}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you get:</Text>
          <View style={styles.feature}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Monitor unlimited family members
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>
              Instant alerts if check-in missed
            </Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>Push notifications + email</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureBullet}>✓</Text>
            <Text style={styles.featureText}>Cancel anytime, no commitment</Text>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By subscribing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={openTermsOfService}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={openPrivacyPolicy}>
              Privacy Policy
            </Text>
            . Subscriptions auto-renew unless canceled.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.footer}>
        <Button
          title={
            purchasing
              ? 'Processing...'
              : `Subscribe ${selectedPackage?.price || ''}`
          }
          onPress={handlePurchase}
          disabled={!selectedPackage || purchasing}
          size="large"
        />

        {purchasing && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}

        {/* Restore Purchases Link */}
        <TouchableOpacity
          onPress={handleRestorePurchases}
          style={styles.restoreButton}
          disabled={loading}>
          <Text style={styles.restoreText}>Restore Previous Purchase</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
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
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    marginBottom: spacing.md,
  },
  securityNotice: {
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  securityText: {
    fontSize: typography.sizes.md,
    color: colors.success,
    textAlign: 'center',
  },
  packagesContainer: {
    marginBottom: spacing.xl,
  },
  packageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  packageCardPopular: {
    borderColor: colors.accent,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: typography.weights.bold as any,
    color: colors.background,
    letterSpacing: 0.5,
  },
  radioContainer: {
    marginRight: spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  packageInfo: {
    flex: 1,
  },
  packageInterval: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  packagePrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: colors.primary,
    marginBottom: 2,
  },
  packagePricePerMonth: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  packageSavings: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: colors.success,
    marginTop: 4,
  },
  featuresContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  featuresTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  feature: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    marginRight: spacing.sm,
    width: 20,
  },
  featureText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  legalContainer: {
    marginBottom: spacing.md,
  },
  legalText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  loader: {
    marginTop: spacing.md,
  },
  restoreButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    padding: spacing.sm,
  },
  restoreText: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default PaymentMethodScreen;
