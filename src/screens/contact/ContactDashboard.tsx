/**
 * Contact Dashboard
 * Shows all members being monitored
 */
import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Card} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {useAppDispatch, useAppSelector} from '../../store';
import {fetchMembers} from '../../store/slices/memberSlice';
import type {MemberInfo} from '../../types/api';

type NavigationProp = NativeStackNavigationProp<any>;

/**
 * Determine member status based on check-in data
 */
const getMemberStatus = (member: MemberInfo): 'active' | 'pending' | 'late' | 'missed' => {
  if (member.status === 'pending') {
    return 'pending';
  }

  if (!member.last_check_in) {
    return 'pending';
  }

  // Check if checked in today
  const lastCheckIn = new Date(member.last_check_in.checked_in_at);
  const today = new Date();
  const isToday = lastCheckIn.toDateString() === today.toDateString();

  if (isToday) {
    if (member.last_check_in.minutes_late && member.last_check_in.minutes_late > 0) {
      return 'late';
    }
    return 'active';
  }

  // Not checked in today - could be missed or pending depending on check-in time
  return 'pending';
};

/**
 * Format last check-in time for display
 */
const formatLastCheckIn = (member: MemberInfo): string => {
  if (!member.last_check_in) {
    return 'No check-ins yet';
  }

  return member.last_check_in.local_time ||
    new Date(member.last_check_in.checked_in_at).toLocaleString();
};

const ContactDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  // Get members from Redux store
  const {members, isLoading, error} = useAppSelector(state => state.member);

  // Fetch members on mount
  useEffect(() => {
    dispatch(fetchMembers());
  }, [dispatch]);

  // Show error alert if fetch fails
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleMemberPress = (member: MemberInfo) => {
    navigation.navigate('MemberDetail', {
      memberId: member.id,
      memberName: member.name,
    });
  };

  const onRefresh = useCallback(async () => {
    try {
      await dispatch(fetchMembers()).unwrap();
    } catch (err) {
      console.error('Error refreshing members:', err);
    }
  }, [dispatch]);

  /**
   * Get status badge configuration based on member status
   */
  const getStatusBadge = (member: MemberInfo) => {
    const status = getMemberStatus(member);

    switch (status) {
      case 'active':
        return {
          style: styles.activeBadge,
          icon: 'check-circle',
          iconColor: colors.success,
          text: 'Checked In',
          textColor: colors.success,
        };
      case 'late':
        return {
          style: styles.lateBadge,
          icon: 'clock',
          iconColor: colors.warning,
          text: 'Late',
          textColor: colors.warning,
        };
      case 'missed':
        return {
          style: styles.missedBadge,
          icon: 'alert-circle',
          iconColor: colors.error,
          text: 'Missed',
          textColor: colors.error,
        };
      case 'pending':
      default:
        return {
          style: styles.pendingBadge,
          icon: 'clock',
          iconColor: colors.textSecondary,
          text: 'Pending',
          textColor: colors.textSecondary,
        };
    }
  };

  // Show loading spinner for initial load
  if (isLoading && members.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Members</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddMember')}
            accessibilityLabel="Add member"
            accessibilityRole="button">
            <Icon name="plus" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddMember')}
          accessibilityLabel="Add member"
          accessibilityRole="button">
          <Icon name="plus" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members as MemberInfo[]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({item}) => {
          const statusBadge = getStatusBadge(item);

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleMemberPress(item)}
              accessibilityLabel={`${item.name}, ${statusBadge.text}`}
              accessibilityRole="button">
              <Card style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <View style={[styles.statusBadge, statusBadge.style]}>
                    <Icon
                      name={statusBadge.icon}
                      size={14}
                      color={statusBadge.iconColor}
                    />
                    <Text style={[styles.statusText, {color: statusBadge.textColor}]}>
                      {statusBadge.text}
                    </Text>
                  </View>
                </View>
                <Text style={styles.lastCheckIn}>
                  Last check-in: {formatLastCheckIn(item)}
                </Text>
                <Text style={styles.checkInTime}>
                  Daily deadline: {item.formatted_time || item.check_in_time || 'Not set'}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    accessibilityLabel={`Call ${item.name}`}
                    accessibilityRole="button">
                    <Icon name="phone" size={18} color={colors.accent} />
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    accessibilityLabel={`Text ${item.name}`}
                    accessibilityRole="button">
                    <Icon name="message-circle" size={18} color={colors.accent} />
                    <Text style={styles.actionText}>Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      navigation.navigate('CheckInHistory', {
                        memberId: item.id,
                        memberName: item.name,
                      })
                    }
                    accessibilityLabel={`View ${item.name}'s history`}
                    accessibilityRole="button">
                    <Icon name="calendar" size={18} color={colors.accent} />
                    <Text style={styles.actionText}>History</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="users" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No members yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to invite your first member
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {...typography.h2},
  addButton: {padding: spacing.sm},
  list: {padding: spacing.lg, gap: spacing.md},
  memberCard: {},
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memberName: {...typography.h3},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  activeBadge: {backgroundColor: colors.primaryLight},
  lateBadge: {backgroundColor: colors.warningLight},
  missedBadge: {backgroundColor: colors.errorLight},
  pendingBadge: {backgroundColor: colors.backgroundGray},
  statusText: {
    ...typography.caption,
    marginLeft: spacing.xs,
  },
  lastCheckIn: {...typography.body, marginBottom: spacing.xs},
  checkInTime: {...typography.bodySmall, color: colors.textSecondary},
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
  actionText: {
    ...typography.button,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {...typography.body, color: colors.textSecondary},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default ContactDashboard;
