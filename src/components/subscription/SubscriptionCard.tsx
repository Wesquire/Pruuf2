/**
 * Subscription Card Component
 * Displays current subscription status and details
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { AccountStatus } from '../../types';

interface SubscriptionCardProps {
  accountStatus: AccountStatus;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  lastFourDigits?: string | null;
  onManagePayment?: () => void;
  onCancelSubscription?: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  accountStatus,
  trialEndsAt,
  subscriptionEndsAt,
  lastFourDigits,
  onManagePayment,
  onCancelSubscription,
}) => {
  const getStatusColor = () => {
    switch (accountStatus) {
      case 'trial':
        return colors.info;
      case 'active':
        return colors.success;
      case 'past_due':
        return colors.warning;
      case 'canceled':
      case 'expired':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = () => {
    switch (accountStatus) {
      case 'trial':
        return 'Free Trial';
      case 'active':
        return 'Active Subscription';
      case 'past_due':
        return 'Payment Failed';
      case 'canceled':
        return 'Canceled';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dateString: string | null | undefined): number => {
    if (!dateString) return 0;
    const endDate = new Date(dateString);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const statusColor = getStatusColor();
  const statusText = getStatusText();

  return (
    <View style={styles.card}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusText}
        </Text>
      </View>

      {/* Trial Information */}
      {accountStatus === 'trial' && trialEndsAt && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Trial ends in:</Text>
          <Text style={styles.infoPrimary}>
            {getDaysRemaining(trialEndsAt)} days
          </Text>
          <Text style={styles.infoSecondary}>
            Ends {formatDate(trialEndsAt)}
          </Text>
          {!lastFourDigits && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Add a payment method to continue after trial
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Active Subscription */}
      {accountStatus === 'active' && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Next billing date:</Text>
          <Text style={styles.infoPrimary}>
            {formatDate(subscriptionEndsAt)}
          </Text>
          <Text style={styles.infoSecondary}>$2.99/month</Text>
          {lastFourDigits && (
            <Text style={styles.cardInfo}>
              Card ending in •••• {lastFourDigits}
            </Text>
          )}
        </View>
      )}

      {/* Past Due */}
      {accountStatus === 'past_due' && (
        <View style={styles.infoSection}>
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              Your last payment failed. Please update your payment method to
              continue using Pruuf.
            </Text>
          </View>
        </View>
      )}

      {/* Canceled */}
      {accountStatus === 'canceled' && subscriptionEndsAt && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Access ends:</Text>
          <Text style={styles.infoPrimary}>
            {formatDate(subscriptionEndsAt)}
          </Text>
          <Text style={styles.infoSecondary}>
            {getDaysRemaining(subscriptionEndsAt)} days remaining
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {(accountStatus === 'trial' || accountStatus === 'past_due') && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onManagePayment}
            accessibilityLabel={lastFourDigits ? 'Update payment method' : 'Add payment method'}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {lastFourDigits ? 'Update Payment Method' : 'Add Payment Method'}
            </Text>
          </TouchableOpacity>
        )}

        {accountStatus === 'active' && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onManagePayment}
              accessibilityLabel="Update payment method"
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>
                Update Payment Method
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={onCancelSubscription}
              accessibilityLabel="Cancel subscription"
              accessibilityRole="button"
            >
              <Text style={styles.dangerButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoPrimary: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoSecondary: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  cardInfo: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  warningBox: {
    backgroundColor: colors.warning + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
  },
  dangerButton: {
    backgroundColor: 'transparent',
  },
  dangerButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.error,
  },
});

export default SubscriptionCard;
