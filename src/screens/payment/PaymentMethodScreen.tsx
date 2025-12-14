/**
 * Payment Method Screen
 * Allows users to add/update their payment method using Stripe
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
import {useStripe, CardField} from '@stripe/stripe-react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../types';
import {Button} from '../../components/common';
import {colors, spacing, typography} from '../../theme';
import {paymentsAPI} from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'AddPayment'>;

export const PaymentMethodScreen: React.FC<Props> = ({navigation}) => {
  const {confirmPayment, createPaymentMethod} = useStripe();
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAddPayment = async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    setLoading(true);

    try {
      // Create payment method with Stripe
      const {paymentMethod, error} = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      if (!paymentMethod) {
        Alert.alert('Error', 'Failed to create payment method');
        setLoading(false);
        return;
      }

      // Send payment method to backend to create subscription
      await paymentsAPI.createSubscription(paymentMethod.id);

      Alert.alert(
        'Success',
        'Your payment method has been added successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to add payment method',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Payment Method</Text>
          <Text style={styles.subtitle}>
            Your card will be charged $2.99/month after your 30-day free trial
          </Text>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityText}>
            🔒 Secured by Stripe. We never see your card details.
          </Text>
        </View>

        {/* Card Input */}
        <View style={styles.cardContainer}>
          <Text style={styles.label}>Card Information</Text>
          <CardField
            postalCodeEnabled={true}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: colors.surface,
              textColor: colors.text.primary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
            }}
            style={styles.cardField}
            onCardChange={details => {
              setCardDetails(details);
            }}
            accessible={true}
            accessibilityLabel="Credit card input field"
          />
        </View>

        {/* Trial Info */}
        <View style={styles.trialInfo}>
          <Text style={styles.trialTitle}>What happens next:</Text>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>•</Text>
            <Text style={styles.trialText}>
              Your card will be saved securely
            </Text>
          </View>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>•</Text>
            <Text style={styles.trialText}>
              No charge for 30 days (free trial)
            </Text>
          </View>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>•</Text>
            <Text style={styles.trialText}>$2.99/month after trial ends</Text>
          </View>
          <View style={styles.trialStep}>
            <Text style={styles.trialBullet}>•</Text>
            <Text style={styles.trialText}>
              Cancel anytime before trial ends
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.footer}>
        <Button
          title={loading ? 'Processing...' : 'Add Payment Method'}
          onPress={handleAddPayment}
          disabled={!cardDetails?.complete || loading}
          size="large"
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        )}
      </View>
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
  cardContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: spacing.sm,
  },
  trialInfo: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trialTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  trialStep: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  trialBullet: {
    fontSize: typography.sizes.md,
    color: colors.primary,
    marginRight: spacing.sm,
    width: 20,
  },
  trialText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
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
});

export default PaymentMethodScreen;
