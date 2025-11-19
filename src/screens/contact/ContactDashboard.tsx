/**
 * Contact Dashboard
 * Shows all members being monitored
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Card } from '../../components/common';
import { colors, typography, spacing } from '../../theme';

const members = [
  {
    id: '1',
    name: 'Mom',
    status: 'active',
    lastCheckIn: 'Today, 9:45 AM',
    checkInTime: '10:00 AM PST',
  },
];

const ContactDashboard: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="plus" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <Text style={styles.memberName}>{item.name}</Text>
              <View style={[styles.statusBadge, styles.activeBadge]}>
                <Icon name="check-circle" size={14} color={colors.success} />
                <Text style={styles.statusText}>Checked In</Text>
              </View>
            </View>
            <Text style={styles.lastCheckIn}>Last check-in: {item.lastCheckIn}</Text>
            <Text style={styles.checkInTime}>Daily deadline: {item.checkInTime}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="phone" size={18} color={colors.accent} />
                <Text style={styles.actionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="message-circle" size={18} color={colors.accent} />
                <Text style={styles.actionText}>Text</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="users" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No members yet</Text>
            <Text style={styles.emptySubtext}>Tap + to invite your first member</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: { ...typography.h2 },
  addButton: { padding: spacing.sm },
  list: { padding: spacing.lg, gap: spacing.md },
  memberCard: {},
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memberName: { ...typography.h3 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  activeBadge: { backgroundColor: colors.primaryLight },
  statusText: { ...typography.caption, marginLeft: spacing.xs, color: colors.success },
  lastCheckIn: { ...typography.body, marginBottom: spacing.xs },
  checkInTime: { ...typography.bodySmall, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  actionText: { ...typography.button, color: colors.accent, marginLeft: spacing.xs },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.md },
  emptySubtext: { ...typography.body, color: colors.textSecondary },
});

export default ContactDashboard;
