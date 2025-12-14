/**
 * Contact Settings Screen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing } from '../../theme';
import { ConfirmDialog } from '../../components/dialogs';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import api from '../../services/api';
import { useAppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';

type NavigationProp = NativeStackNavigationProp<any>;

const ContactSettings: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { dialogProps, showConfirm } = useConfirmDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogOut = () => {
    showConfirm(
      {
        title: 'Log Out',
        message: 'Are you sure you want to log out? You will need to sign in again to access your account.',
        confirmText: 'Log Out',
        cancelText: 'Cancel',
        destructive: false,
      },
      confirmLogOut
    );
  };

  const confirmLogOut = async () => {
    try {
      setIsLoggingOut(true);
      await dispatch(logout());
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAccount = () => {
    showConfirm(
      {
        title: 'Delete Account',
        message: 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        destructive: true,
      },
      confirmDeleteAccount
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await api.delete('/api/account');
      Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
      // Navigate to welcome screen or handle logout
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <SettingRow icon="credit-card" label="Payment Method" value="•••• 4242" />
        <SettingRow
          icon="bell"
          label="Notification Settings"
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <SettingRow icon="type" label="Text Size" value="Standard" />
        <SettingRow icon="phone" label="Phone Number" value="(555) 123-4567" />
        <SettingRow
          icon="help-circle"
          label="Help & Support"
          onPress={() => navigation.navigate('Help')}
        />
        <SettingRow
          icon="log-out"
          label="Log Out"
          onPress={handleLogOut}
        />
        <SettingRow
          icon="trash-2"
          label="Delete Account"
          danger
          onPress={handleDeleteAccount}
        />
      </ScrollView>

      <View style={styles.subscriptionInfo}>
        <Text style={styles.subscriptionLabel}>Current Plan</Text>
        <Text style={styles.subscriptionValue}>Pruuf • $2.99/month</Text>
        <Text style={styles.subscriptionDetail}>Next billing: Dec 18, 2025</Text>
      </View>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...dialogProps} />
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
