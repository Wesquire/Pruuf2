import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import api from '../utils/api';

interface NotificationPreferences {
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  push_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
}

const NotificationSettingsScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const fontSize = user?.font_size_preference || 'standard';
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    reminder_enabled: true,
    reminder_minutes_before: 15,
    push_notifications_enabled: true,
    sms_notifications_enabled: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint to get notification preferences
      const response = await api.get('/api/members/notification-preferences');
      setPreferences(response.data.preferences);
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      // Save to backend
      await api.patch('/api/members/notification-preferences', newPreferences);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to save preferences'
      );
      // Revert on error
      loadPreferences();
    } finally {
      setSaving(false);
    }
  };

  const toggleReminderEnabled = (value: boolean) => {
    savePreferences({ reminder_enabled: value });
  };

  const togglePushNotifications = (value: boolean) => {
    savePreferences({ push_notifications_enabled: value });
  };

  const toggleSmsNotifications = (value: boolean) => {
    savePreferences({ sms_notifications_enabled: value });
  };

  const setReminderTime = (minutes: number) => {
    savePreferences({ reminder_minutes_before: minutes });
  };

  const baseFontSize = FONT_SIZES[fontSize];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: baseFontSize * 1.8 }]}>
            Notification Settings
          </Text>
          <Text style={[styles.subtitle, { fontSize: baseFontSize * 1.0 }]}>
            Manage your check-in reminders and alerts
          </Text>
        </View>

        {/* Check-in Reminders Section */}
        {user?.is_member && (
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}
            >
              Check-in Reminders
            </Text>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text
                  style={[styles.settingLabel, { fontSize: baseFontSize * 1.1 }]}
                >
                  Enable Reminders
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { fontSize: baseFontSize * 0.9 },
                  ]}
                >
                  Get notified before your check-in time
                </Text>
              </View>
              <Switch
                value={preferences.reminder_enabled}
                onValueChange={toggleReminderEnabled}
                trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                thumbColor={COLORS.white}
                disabled={saving}
              />
            </View>

            {preferences.reminder_enabled && (
              <>
                <Text
                  style={[
                    styles.subSectionTitle,
                    { fontSize: baseFontSize * 1.1 },
                  ]}
                >
                  Reminder Time
                </Text>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    preferences.reminder_minutes_before === 15 &&
                      styles.radioOptionSelected,
                  ]}
                  onPress={() => setReminderTime(15)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View style={styles.radio}>
                    {preferences.reminder_minutes_before === 15 && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      { fontSize: baseFontSize * 1.0 },
                    ]}
                  >
                    15 minutes before
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    preferences.reminder_minutes_before === 30 &&
                      styles.radioOptionSelected,
                  ]}
                  onPress={() => setReminderTime(30)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View style={styles.radio}>
                    {preferences.reminder_minutes_before === 30 && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      { fontSize: baseFontSize * 1.0 },
                    ]}
                  >
                    30 minutes before
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    preferences.reminder_minutes_before === 60 &&
                      styles.radioOptionSelected,
                  ]}
                  onPress={() => setReminderTime(60)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View style={styles.radio}>
                    {preferences.reminder_minutes_before === 60 && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      { fontSize: baseFontSize * 1.0 },
                    ]}
                  >
                    1 hour before
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}
          >
            Push Notifications
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text
                style={[styles.settingLabel, { fontSize: baseFontSize * 1.1 }]}
              >
                Enable Push Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { fontSize: baseFontSize * 0.9 },
                ]}
              >
                {user?.is_member
                  ? 'Get notified about reminders and updates'
                  : 'Get notified about missed check-ins and alerts'}
              </Text>
            </View>
            <Switch
              value={preferences.push_notifications_enabled}
              onValueChange={togglePushNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
              disabled={saving}
            />
          </View>
        </View>

        {/* SMS Notifications Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}
          >
            SMS Notifications
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text
                style={[styles.settingLabel, { fontSize: baseFontSize * 1.1 }]}
              >
                Enable SMS Notifications
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { fontSize: baseFontSize * 0.9 },
                ]}
              >
                {user?.is_member
                  ? 'Receive important updates via SMS'
                  : 'Receive missed check-in alerts via SMS'}
              </Text>
            </View>
            <Switch
              value={preferences.sms_notifications_enabled}
              onValueChange={toggleSmsNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
              disabled={saving}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={[styles.infoText, { fontSize: baseFontSize * 0.9 }]}>
              Note: Critical safety alerts (missed check-ins) will always be
              sent via SMS regardless of this setting.
            </Text>
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}
          >
            About Notifications
          </Text>

          <Text style={[styles.infoText, { fontSize: baseFontSize * 1.0 }]}>
            {user?.is_member
              ? 'As a Member, you can receive reminders before your check-in time. Your Contacts will always be notified if you miss a check-in.'
              : 'As a Contact, you will receive notifications when your Members miss their daily check-in or check in late. You can also receive updates about relationship changes.'}
          </Text>
        </View>

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text
              style={[styles.savingText, { fontSize: baseFontSize * 0.9 }]}
            >
              Saving preferences...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.white,
    opacity: 0.9,
  },
  section: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subSectionTitle: {
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  radioOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    color: COLORS.text,
    fontWeight: '500',
  },
  infoBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  infoText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  savingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  savingText: {
    marginLeft: SPACING.sm,
    color: COLORS.textSecondary,
  },
});

export default NotificationSettingsScreen;
