/**
 * Notification Preferences Screen
 * Allows users to configure push and email notification preferences
 *
 * IMPORTANT: Critical notifications (missed check-ins, payment failures, account frozen)
 * always send via at least one channel (safety override) regardless of preferences.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather as Icon } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';
import { useAppSelector } from '../../store';
import { settingsAPI } from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

const NotificationPreferencesScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAppSelector(state => state.auth);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getNotificationPreferences();

      if (response.success && response.preferences) {
        setPushEnabled(response.preferences.push_notifications_enabled);
        setEmailEnabled(response.preferences.email_notifications_enabled);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (
    newPushEnabled: boolean,
    newEmailEnabled: boolean
  ) => {
    // Validate: At least one channel must be enabled for critical notifications
    if (!newPushEnabled && !newEmailEnabled) {
      Alert.alert(
        'Cannot Disable Both',
        'At least one notification method must be enabled to receive critical safety alerts.',
        [{ text: 'OK' }]
      );
      // Reset toggles to previous values
      setPushEnabled(pushEnabled);
      setEmailEnabled(emailEnabled);
      return;
    }

    try {
      setSaving(true);

      const response = await settingsAPI.updateNotificationPreferences({
        push_notifications_enabled: newPushEnabled,
        email_notifications_enabled: newEmailEnabled,
      });

      if (response.success) {
        // Update local state
        setPushEnabled(newPushEnabled);
        setEmailEnabled(newEmailEnabled);

        // Show confirmation
        Alert.alert(
          'Preferences Updated',
          'Your notification preferences have been saved.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(response.error || 'Failed to update preferences');
      }
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to save notification preferences. Please try again.'
      );
      // Reset to previous values
      loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = (value: boolean) => {
    setPushEnabled(value);
    savePreferences(value, emailEnabled);
  };

  const handleEmailToggle = (value: boolean) => {
    setEmailEnabled(value);
    savePreferences(pushEnabled, value);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Icon name="shield" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Safety First</Text>
            <Text style={styles.infoText}>
              Critical safety alerts (missed check-ins, payment failures, account issues)
              will always be sent via at least one method to ensure you never miss an important alert.
            </Text>
          </View>
        </View>

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <Text style={styles.sectionDescription}>
            Receive instant notifications on this device
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="smartphone" size={24} color={colors.textPrimary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  {pushEnabled
                    ? 'Enabled - You\'ll receive instant alerts'
                    : 'Disabled - Email only'}
                </Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              disabled={saving}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={pushEnabled ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Push notifications toggle"
              accessibilityState={{ checked: pushEnabled }}
            />
          </View>

          {/* Push Notification Types */}
          <View style={styles.notificationTypes}>
            <Text style={styles.typesTitle}>What you'll receive:</Text>

            <View style={styles.typeRow}>
              <Icon name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.typeText}>
                <Text style={styles.typeBold}>Critical:</Text> Missed check-ins,
                payment failures (always sent)
              </Text>
            </View>

            <View style={styles.typeRow}>
              <Icon name="bell" size={18} color={colors.warning} />
              <Text style={styles.typeText}>
                <Text style={styles.typeBold}>High Priority:</Text> Check-in
                confirmations, late check-ins
              </Text>
            </View>

            <View style={styles.typeRow}>
              <Icon name="info" size={18} color={colors.info} />
              <Text style={styles.typeText}>
                <Text style={styles.typeBold}>Normal:</Text> Reminders, trial updates
              </Text>
            </View>
          </View>
        </View>

        {/* Email Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Notifications</Text>
          <Text style={styles.sectionDescription}>
            Receive notifications at {user?.email || 'your email'}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Icon name="mail" size={24} color={colors.textPrimary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Email Notifications</Text>
                <Text style={styles.settingDescription}>
                  {emailEnabled
                    ? 'Enabled - Backup delivery method'
                    : 'Disabled - Push only'}
                </Text>
              </View>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={handleEmailToggle}
              disabled={saving}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={emailEnabled ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
              accessible={true}
              accessibilityRole="switch"
              accessibilityLabel="Email notifications toggle"
              accessibilityState={{ checked: emailEnabled }}
            />
          </View>

          {/* Email Notification Strategy */}
          <View style={styles.notificationTypes}>
            <Text style={styles.typesTitle}>How email notifications work:</Text>

            <View style={styles.typeRow}>
              <Icon name="shield" size={18} color={colors.error} />
              <Text style={styles.typeText}>
                <Text style={styles.typeBold}>Critical alerts:</Text> Always sent via
                both push AND email
              </Text>
            </View>

            <View style={styles.typeRow}>
              <Icon name="zap" size={18} color={colors.warning} />
              <Text style={styles.typeText}>
                <Text style={styles.typeBold}>High priority:</Text> Email sent if push
                fails
              </Text>
            </View>

            <View style={styles.typeRow}>
              <Icon name="check" size={18} color={colors.success} />
              <Text style={styles.typeText}>
                <Text style={styles.typeBold}>Normal priority:</Text> Push only (no
                email)
              </Text>
            </View>
          </View>
        </View>

        {/* Notification Strategy Explanation */}
        <View style={styles.strategyBox}>
          <Text style={styles.strategyTitle}>Our Dual Notification Strategy</Text>
          <Text style={styles.strategyText}>
            Pruuf uses both push and email notifications to ensure critical safety alerts
            are always delivered, even if one method fails.
          </Text>
          <Text style={styles.strategyText}>
            For non-critical notifications (reminders, confirmations), we respect your
            preferences to avoid notification fatigue.
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  notificationTypes: {
    backgroundColor: colors.backgroundGray,
    padding: spacing.md,
    borderRadius: 8,
  },
  typesTitle: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  typeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  typeBold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  strategyBox: {
    backgroundColor: colors.accentLight,
    padding: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  strategyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  strategyText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
});

export default NotificationPreferencesScreen;
