import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootState} from '../store';
import {COLORS, SPACING, FONT_SIZES} from '../utils/constants';
import type {FontSizePreference} from '../theme/typography';
import api from '../services/api';
import moment from 'moment-timezone';
import {SkeletonDetailScreen} from '../components/skeletons';
import {ConfirmDialog} from '../components/dialogs';
import {useConfirmDialog} from '../hooks/useConfirmDialog';

interface CheckIn {
  id: string;
  checked_in_at: string;
  timezone: string;
}

interface MemberDetails {
  id: string;
  user_id: string;
  name: string;
  check_in_time: string;
  timezone: string;
  onboarding_completed: boolean;
  relationship_status: 'pending' | 'active' | 'removed';
  invited_at: string;
  connected_at: string | null;
  last_check_in: CheckIn | null;
  checked_in_today: boolean;
  minutes_since_deadline: number | null;
}

type RouteParams = {
  MemberDetail: {
    memberId: string;
  };
};

const MemberDetailScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const fontSize = (user?.font_size_preference ||
    'standard') as FontSizePreference;
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'MemberDetail'>>();
  const {dialogProps, showConfirm} = useConfirmDialog();

  const {memberId} = route.params;

  const [loading, setLoading] = useState(true);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(
    null,
  );
  const [checkInHistory, setCheckInHistory] = useState<CheckIn[]>([]);
  const [resending, setResending] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadMemberDetails();
    loadCheckInHistory();
  }, [memberId]);

  const loadMemberDetails = async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint to get member details
      const response = await api.get(`/api/contacts/members/${memberId}`);
      setMemberDetails(response.data.member);
    } catch (error: any) {
      console.error('Error loading member details:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckInHistory = async () => {
    try {
      // This would be a new API endpoint to get member check-in history
      const response = await api.get(
        `/api/contacts/members/${memberId}/check-ins`,
      );
      setCheckInHistory(response.data.check_ins);
    } catch (error: any) {
      console.error('Error loading check-in history:', error);
    }
  };

  const handleResendInvite = async () => {
    try {
      setResending(true);
      await api.post('/api/contacts/resend-invite', {
        member_id: memberDetails?.user_id,
      });
      Alert.alert('Success', 'Invitation resent successfully');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to resend invitation',
      );
    } finally {
      setResending(false);
    }
  };

  const handleRemoveRelationship = () => {
    showConfirm(
      {
        title: 'Remove Member',
        message: `Are you sure you want to remove ${memberDetails?.name}? Both of you will be notified via email.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        destructive: true,
      },
      confirmRemoveRelationship,
    );
  };

  const confirmRemoveRelationship = async () => {
    try {
      setRemoving(true);
      await api.delete('/api/contacts/remove-relationship', {
        data: {member_id: memberDetails?.user_id},
      });
      Alert.alert('Success', 'Relationship removed successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to remove relationship',
      );
    } finally {
      setRemoving(false);
    }
  };

  const getStatusColor = () => {
    if (!memberDetails?.onboarding_completed) {
      return COLORS.warning;
    }
    if (memberDetails.checked_in_today) {
      return COLORS.success;
    }
    if (
      memberDetails.minutes_since_deadline !== null &&
      memberDetails.minutes_since_deadline > 0
    ) {
      return COLORS.error;
    }
    return COLORS.textSecondary;
  };

  const getStatusText = () => {
    if (!memberDetails?.onboarding_completed) {
      return 'Invitation Pending';
    }
    if (memberDetails.checked_in_today) {
      const checkInTime = moment(memberDetails.last_check_in?.checked_in_at);
      return `Checked in at ${checkInTime.format('h:mm A')}`;
    }
    if (
      memberDetails.minutes_since_deadline !== null &&
      memberDetails.minutes_since_deadline > 0
    ) {
      const hours = Math.floor(memberDetails.minutes_since_deadline / 60);
      const minutes = memberDetails.minutes_since_deadline % 60;
      if (hours > 0) {
        return `Missed check-in by ${hours}h ${minutes}m`;
      }
      return `Missed check-in by ${minutes}m`;
    }
    return 'Not checked in yet today';
  };

  const baseFontSize = FONT_SIZES[fontSize];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonDetailScreen />
      </SafeAreaView>
    );
  }

  if (!memberDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, {fontSize: baseFontSize * 1.1}]}>
            Member not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.memberName, {fontSize: baseFontSize * 2.0}]}>
            {memberDetails.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getStatusColor() + '20'},
            ]}>
            <Text
              style={[
                styles.statusText,
                {fontSize: baseFontSize * 1.0, color: getStatusColor()},
              ]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {fontSize: baseFontSize * 1.4}]}>
            Details
          </Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {fontSize: baseFontSize * 1.0}]}>
              Check-in Time
            </Text>
            <Text style={[styles.detailValue, {fontSize: baseFontSize * 1.0}]}>
              {memberDetails.check_in_time
                ? moment(memberDetails.check_in_time, 'HH:mm').format('h:mm A')
                : 'Not set'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {fontSize: baseFontSize * 1.0}]}>
              Timezone
            </Text>
            <Text style={[styles.detailValue, {fontSize: baseFontSize * 1.0}]}>
              {memberDetails.timezone || 'Not set'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {fontSize: baseFontSize * 1.0}]}>
              Status
            </Text>
            <Text style={[styles.detailValue, {fontSize: baseFontSize * 1.0}]}>
              {memberDetails.relationship_status === 'pending'
                ? 'Pending'
                : 'Active'}
            </Text>
          </View>

          {memberDetails.connected_at && (
            <View style={styles.detailRow}>
              <Text
                style={[styles.detailLabel, {fontSize: baseFontSize * 1.0}]}>
                Connected Since
              </Text>
              <Text
                style={[styles.detailValue, {fontSize: baseFontSize * 1.0}]}>
                {moment(memberDetails.connected_at).format('MMM D, YYYY')}
              </Text>
            </View>
          )}
        </View>

        {/* Recent Check-ins */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {fontSize: baseFontSize * 1.4}]}>
            Recent Check-ins
          </Text>

          {checkInHistory.length === 0 ? (
            <Text style={[styles.emptyText, {fontSize: baseFontSize * 1.0}]}>
              No check-ins yet
            </Text>
          ) : (
            checkInHistory.slice(0, 7).map(checkIn => (
              <View key={checkIn.id} style={styles.checkInRow}>
                <Text
                  style={[styles.checkInDate, {fontSize: baseFontSize * 1.0}]}>
                  {moment(checkIn.checked_in_at).format('ddd, MMM D')}
                </Text>
                <Text
                  style={[styles.checkInTime, {fontSize: baseFontSize * 1.0}]}>
                  {moment(checkIn.checked_in_at).format('h:mm A')}
                </Text>
              </View>
            ))
          )}

          {checkInHistory.length > 7 && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => navigation.navigate('CheckInHistory', {memberId})}
              activeOpacity={0.7}>
              <Text
                style={[styles.viewMoreText, {fontSize: baseFontSize * 1.0}]}>
                View All Check-ins
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          {memberDetails.relationship_status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleResendInvite}
              disabled={resending}
              activeOpacity={0.8}>
              {resending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text
                  style={[
                    styles.actionButtonText,
                    {fontSize: baseFontSize * 1.1},
                  ]}>
                  Resend Invitation
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={handleRemoveRelationship}
            disabled={removing}
            activeOpacity={0.8}>
            {removing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.actionButtonText,
                  {fontSize: baseFontSize * 1.1},
                ]}>
                Remove Member
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDialog {...dialogProps} />
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
  errorText: {
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  memberName: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontWeight: '600',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.textSecondary,
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: '600',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  checkInRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkInDate: {
    color: COLORS.text,
    fontWeight: '600',
  },
  checkInTime: {
    color: COLORS.textSecondary,
  },
  viewMoreButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  viewMoreText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  removeButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default MemberDetailScreen;
