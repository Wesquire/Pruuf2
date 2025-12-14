/**
 * BiometricPrompt Component
 * Item 29: Add Biometric Authentication (MEDIUM)
 *
 * Modal prompt for biometric authentication setup
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
import {BiometricType} from '../../utils/biometrics';

export interface BiometricPromptProps {
  visible: boolean;
  biometryType: BiometricType;
  onEnable: () => void;
  onDismiss: () => void;
  title?: string;
  message?: string;
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  visible,
  biometryType,
  onEnable,
  onDismiss,
  title,
  message,
}) => {
  const getIcon = (): string => {
    if (biometryType === 'FaceID') {
      return 'smile';
    }
    return 'fingerprint';
  };

  const getTitle = (): string => {
    if (title) {
      return title;
    }

    if (biometryType === 'FaceID') {
      return 'Enable Face ID';
    } else if (biometryType === 'TouchID') {
      return 'Enable Touch ID';
    }
    return 'Enable Biometric Login';
  };

  const getMessage = (): string => {
    if (message) {
      return message;
    }

    if (biometryType === 'FaceID') {
      return 'Use Face ID for quick and secure login to your account.';
    } else if (biometryType === 'TouchID') {
      return 'Use Touch ID for quick and secure login to your account.';
    }
    return 'Use biometric authentication for quick and secure login.';
  };

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
            <View style={styles.iconCircle}>
              <Icon name={getIcon()} size={48} color={colors.primary} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{getTitle()}</Text>

          {/* Message */}
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            <View style={styles.benefitRow}>
              <Icon name="zap" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Faster login</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="shield" size={20} color={colors.success} />
              <Text style={styles.benefitText}>More secure</Text>
            </View>
            <View style={styles.benefitRow}>
              <Icon name="lock" size={20} color={colors.success} />
              <Text style={styles.benefitText}>No need to remember PIN</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onEnable}
              accessibilityRole="button"
              accessibilityLabel={`Enable ${
                biometryType || 'biometric authentication'
              }`}>
              <Text style={styles.primaryButtonText}>Enable</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Maybe later">
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  benefits: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default BiometricPrompt;
