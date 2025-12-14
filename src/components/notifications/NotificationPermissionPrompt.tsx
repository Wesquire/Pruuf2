/**
 * Notification Permission Prompt Component
 * Item 37: Add Notification Permission Prompt (MEDIUM)
 *
 * User-friendly prompt for requesting notification permissions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {colors, typography, spacing, borderRadius} from '../../theme';

export interface NotificationPermissionPromptProps {
  visible: boolean;
  onRequestPermission: () => void;
  onDismiss: () => void;
  title?: string;
  message?: string;
  benefits?: string[];
}

export const NotificationPermissionPrompt: React.FC<
  NotificationPermissionPromptProps
> = ({
  visible,
  onRequestPermission,
  onDismiss,
  title = 'Stay Connected',
  message = 'Get notified about important check-ins and updates from your loved ones.',
  benefits = [
    'Know when check-ins are missed',
    'Receive emergency alerts',
    'Stay informed about family activity',
  ],
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="bell" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Benefits List */}
          <View style={styles.benefitsList}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Icon name="check-circle" size={20} color={colors.success} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onRequestPermission}
              accessibilityRole="button"
              accessibilityLabel="Enable notifications">
              <Text style={styles.primaryButtonText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Not now">
              <Text style={styles.secondaryButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>

          {/* Platform-specific note */}
          {Platform.OS === 'ios' && (
            <Text style={styles.footnote}>
              You can always change this in Settings later
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  benefitsList: {
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  footnote: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default NotificationPermissionPrompt;
