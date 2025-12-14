import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootState } from '../store';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import api from '../services/api';
import moment from 'moment-timezone';
import { SkeletonSection, SkeletonCheckInItem } from '../components/skeletons';

interface CheckIn {
  id: string;
  checked_in_at: string;
  timezone: string;
  was_late: boolean;
  minutes_late: number | null;
}

interface Stats {
  total_check_ins: number;
  on_time_check_ins: number;
  late_check_ins: number;
  missed_check_ins: number;
  on_time_percentage: number;
}

type RouteParams = {
  CheckInHistory: {
    memberId: string;
    memberName?: string;
  };
};

const CheckInHistoryScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const fontSize = user?.font_size_preference || 'standard';
  const route = useRoute<RouteProp<RouteParams, 'CheckInHistory'>>();

  const { memberId, memberName } = route.params;

  const [loading, setLoading] = useState(true);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<'7days' | '30days' | 'all'>('30days');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCheckInHistory();
  }, [memberId, filter]);

  const loadCheckInHistory = async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint to get check-in history with stats
      const response = await api.get(
        `/api/contacts/members/${memberId}/check-ins`,
        {
          params: { filter },
        }
      );
      setCheckIns(response.data.check_ins);
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Error loading check-in history:', error);
      Alert.alert('Error', 'Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };

  const getFilterLabel = () => {
    switch (filter) {
      case '7days':
        return 'Last 7 Days';
      case '30days':
        return 'Last 30 Days';
      case 'all':
        return 'All Time';
    }
  };

  /**
   * Filter check-ins based on search query
   */
  const filteredCheckIns = useMemo(() => {
    if (!searchQuery.trim()) {
      return checkIns;
    }

    const query = searchQuery.toLowerCase();

    return checkIns.filter(checkIn => {
      const checkInDate = moment(checkIn.checked_in_at);
      const checkInTime = checkInDate.format('h:mm A').toLowerCase();
      const dateString = checkInDate.format('MMMM D, YYYY dddd').toLowerCase();
      const shortDateString = checkInDate.format('MMM D, YYYY').toLowerCase();
      const status = checkIn.was_late ? 'late' : 'on time';

      // Search by time (e.g., "9:00", "9am", "morning")
      if (checkInTime.includes(query)) return true;

      // Search by date (e.g., "January", "Jan 15", "2024", "Monday")
      if (dateString.includes(query) || shortDateString.includes(query)) return true;

      // Search by year
      if (checkInDate.format('YYYY').includes(query)) return true;

      // Search by status
      if (status.includes(query)) return true;

      return false;
    });
  }, [checkIns, searchQuery]);

  const groupCheckInsByDate = () => {
    const grouped: { [key: string]: CheckIn[] } = {};

    filteredCheckIns.forEach((checkIn) => {
      const date = moment(checkIn.checked_in_at).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(checkIn);
    });

    return grouped;
  };

  const baseFontSize = FONT_SIZES[fontSize];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <SkeletonSection rows={2} />
        </View>
        <View style={{ paddingVertical: SPACING.md }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCheckInItem key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const groupedCheckIns = groupCheckInsByDate();
  const dates = Object.keys(groupedCheckIns).sort().reverse();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {memberName && (
          <Text style={[styles.memberName, { fontSize: baseFontSize * 1.4 }]}>
            {memberName}
          </Text>
        )}
        <Text style={[styles.headerTitle, { fontSize: baseFontSize * 1.1 }]}>
          Check-in History
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { fontSize: baseFontSize * 1.0 }]}
          placeholder="Search by date, time, or status..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          testID="search-input"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
            testID="clear-search"
          >
            <Icon name="x-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === '7days' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('7days')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              { fontSize: baseFontSize * 0.9 },
              filter === '7days' && styles.filterButtonTextActive,
            ]}
          >
            Last 7 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === '30days' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('30days')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              { fontSize: baseFontSize * 0.9 },
              filter === '30days' && styles.filterButtonTextActive,
            ]}
          >
            Last 30 Days
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterButtonText,
              { fontSize: baseFontSize * 0.9 },
              filter === 'all' && styles.filterButtonTextActive,
            ]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { fontSize: baseFontSize * 2.0 }]}>
              {stats.total_check_ins}
            </Text>
            <Text style={[styles.statLabel, { fontSize: baseFontSize * 0.9 }]}>
              Total Check-ins
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text
              style={[
                styles.statValue,
                { fontSize: baseFontSize * 2.0, color: COLORS.success },
              ]}
            >
              {stats.on_time_check_ins}
            </Text>
            <Text style={[styles.statLabel, { fontSize: baseFontSize * 0.9 }]}>
              On Time
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text
              style={[
                styles.statValue,
                { fontSize: baseFontSize * 2.0, color: COLORS.warning },
              ]}
            >
              {stats.late_check_ins}
            </Text>
            <Text style={[styles.statLabel, { fontSize: baseFontSize * 0.9 }]}>
              Late
            </Text>
          </View>

          <View style={styles.statBox}>
            <Text
              style={[
                styles.statValue,
                { fontSize: baseFontSize * 2.0, color: COLORS.error },
              ]}
            >
              {stats.missed_check_ins}
            </Text>
            <Text style={[styles.statLabel, { fontSize: baseFontSize * 0.9 }]}>
              Missed
            </Text>
          </View>
        </View>
      )}

      {/* On-time Percentage Bar */}
      {stats && stats.total_check_ins > 0 && (
        <View style={styles.percentageContainer}>
          <View style={styles.percentageBar}>
            <View
              style={[
                styles.percentageFill,
                { width: `${stats.on_time_percentage}%` },
              ]}
            />
          </View>
          <Text
            style={[styles.percentageText, { fontSize: baseFontSize * 1.0 }]}
          >
            {stats.on_time_percentage.toFixed(1)}% On Time
          </Text>
        </View>
      )}

      {/* Check-in List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredCheckIns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="search" size={48} color={COLORS.textTertiary} style={{ marginBottom: SPACING.md }} />
            <Text style={[styles.emptyText, { fontSize: baseFontSize * 1.1 }]}>
              {searchQuery ? `No check-ins found matching "${searchQuery}"` : `No check-ins found for ${getFilterLabel().toLowerCase()}`}
            </Text>
            {searchQuery && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchButton}
              >
                <Text style={[styles.clearSearchText, { fontSize: baseFontSize * 1.0 }]}>
                  Clear search
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          dates.map((date) => (
            <View key={date} style={styles.dateSection}>
              <Text
                style={[styles.dateHeader, { fontSize: baseFontSize * 1.2 }]}
              >
                {moment(date).format('dddd, MMMM D, YYYY')}
              </Text>

              {groupedCheckIns[date].map((checkIn) => (
                <View key={checkIn.id} style={styles.checkInCard}>
                  <View style={styles.checkInLeft}>
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor: checkIn.was_late
                            ? COLORS.warning
                            : COLORS.success,
                        },
                      ]}
                    />
                    <View>
                      <Text
                        style={[
                          styles.checkInTime,
                          { fontSize: baseFontSize * 1.1 },
                        ]}
                      >
                        {moment(checkIn.checked_in_at).format('h:mm A')}
                      </Text>
                      {checkIn.was_late && checkIn.minutes_late !== null && (
                        <Text
                          style={[
                            styles.lateText,
                            { fontSize: baseFontSize * 0.9 },
                          ]}
                        >
                          {checkIn.minutes_late} min late
                        </Text>
                      )}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: checkIn.was_late
                          ? COLORS.warning + '20'
                          : COLORS.success + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          fontSize: baseFontSize * 0.9,
                          color: checkIn.was_late
                            ? COLORS.warning
                            : COLORS.success,
                        },
                      ]}
                    >
                      {checkIn.was_late ? 'Late' : 'On Time'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  memberName: {
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    color: COLORS.white,
    opacity: 0.9,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 6,
    marginHorizontal: SPACING.xs,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  percentageContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  percentageBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  percentageFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  percentageText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  clearSearchText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  dateSection: {
    marginTop: SPACING.md,
  },
  dateHeader: {
    fontWeight: 'bold',
    color: COLORS.text,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightGray,
  },
  checkInCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  checkInTime: {
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  lateText: {
    color: COLORS.warning,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontWeight: '600',
  },
});

export default CheckInHistoryScreen;
