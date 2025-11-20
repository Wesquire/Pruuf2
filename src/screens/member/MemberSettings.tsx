/**
 * Member Settings Screen
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius } from '../../theme';

type NavigationProp = NativeStackNavigationProp<any>;

const MemberSettings: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <SettingRow icon="clock" label="Check-in Time" value="10:00 AM PST" />
        <SettingToggle icon="bell" label="Daily Reminder" subtitle="1 hour before check-in" value={true} />
        <SettingRow
          icon="bell"
          label="Notification Settings"
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <SettingRow icon="type" label="Text Size" value="Large" />
        <SettingRow icon="users" label="Your Contacts" value="2 active" />
        <SettingRow icon="phone" label="Phone Number" value="(555) 987-6543" />
        <SettingRow
          icon="help-circle"
          label="Help & Support"
          onPress={() => navigation.navigate('Help')}
        />
        <SettingRow icon="trash-2" label="Delete Account" danger />
      </ScrollView>
    </SafeAreaView>
  );
};

const SettingRow = ({ icon, label, value, danger, onPress }: any) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
    <Icon name={icon} size={20} color={danger ? colors.error : colors.textPrimary} />
    <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    <Icon name="chevron-right" size={20} color={colors.textSecondary} />
  </TouchableOpacity>
);

const SettingToggle = ({ icon, label, subtitle, value }: any) => (
  <View style={styles.row}>
    <Icon name={icon} size={20} color={colors.textPrimary} />
    <View style={styles.toggleContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    <Switch value={value} />
  </View>
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
  toggleContent: { flex: 1, marginLeft: spacing.md },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  dangerText: { color: colors.error },
});

export default MemberSettings;
