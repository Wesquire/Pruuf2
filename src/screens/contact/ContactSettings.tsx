/**
 * Contact Settings Screen
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing } from '../../theme';

const ContactSettings: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <SettingRow icon="credit-card" label="Payment Method" value="•••• 4242" />
        <SettingRow icon="type" label="Text Size" value="Standard" />
        <SettingRow icon="phone" label="Phone Number" value="(555) 123-4567" />
        <SettingRow icon="help-circle" label="Help & Support" />
        <SettingRow icon="log-out" label="Log Out" />
        <SettingRow icon="trash-2" label="Delete Account" danger />
      </ScrollView>

      <View style={styles.subscriptionInfo}>
        <Text style={styles.subscriptionLabel}>Current Plan</Text>
        <Text style={styles.subscriptionValue}>Pruuf • $2.99/month</Text>
        <Text style={styles.subscriptionDetail}>Next billing: Dec 18, 2025</Text>
      </View>
    </SafeAreaView>
  );
};

const SettingRow = ({ icon, label, value, danger }: any) => (
  <TouchableOpacity style={styles.row}>
    <Icon name={icon} size={20} color={danger ? colors.error : colors.textPrimary} />
    <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    <Icon name="chevron-right" size={20} color={colors.textSecondary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg },
  title: { ...typography.h2 },
  content: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.body, flex: 1, marginLeft: spacing.md },
  rowValue: { ...typography.body, color: colors.textSecondary, marginRight: spacing.sm },
  dangerText: { color: colors.error },
  subscriptionInfo: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundGray,
  },
  subscriptionLabel: { ...typography.caption, color: colors.textSecondary },
  subscriptionValue: { ...typography.h3, marginTop: spacing.xs },
  subscriptionDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
});

export default ContactSettings;
