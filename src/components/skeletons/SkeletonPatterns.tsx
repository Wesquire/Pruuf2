/**
 * Skeleton Loading Patterns
 * Pre-built skeleton layouts for common UI patterns
 * Item 27: Add Loading Skeletons (LOW)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonCircle } from './Skeleton';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';

/**
 * List Item Skeleton
 * For member/contact list items
 */
export const SkeletonListItem: React.FC<{ showAvatar?: boolean }> = ({
  showAvatar = true
}) => {
  return (
    <View style={styles.listItem}>
      {showAvatar && <SkeletonCircle size={48} style={styles.avatar} />}
      <View style={styles.listContent}>
        <Skeleton width="70%" height={18} style={{ marginBottom: spacing.xs }} />
        <Skeleton width="50%" height={14} />
      </View>
      <View style={styles.listRight}>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

/**
 * Card Skeleton
 * For dashboard cards and info boxes
 */
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={20} style={{ marginBottom: spacing.md }} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '40%' : '100%'}
          height={16}
          style={{ marginBottom: spacing.sm }}
        />
      ))}
    </View>
  );
};

/**
 * Profile Header Skeleton
 * For member/contact detail screens
 */
export const SkeletonProfile: React.FC = () => {
  return (
    <View style={styles.profile}>
      <SkeletonCircle size={80} style={{ marginBottom: spacing.md }} />
      <Skeleton width={180} height={24} style={{ marginBottom: spacing.sm }} />
      <Skeleton width={120} height={16} style={{ marginBottom: spacing.lg }} />

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Skeleton width={40} height={32} style={{ marginBottom: spacing.xs }} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={styles.statBox}>
          <Skeleton width={40} height={32} style={{ marginBottom: spacing.xs }} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={styles.statBox}>
          <Skeleton width={40} height={32} style={{ marginBottom: spacing.xs }} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
};

/**
 * Detail Row Skeleton
 * For key-value detail rows
 */
export const SkeletonDetailRow: React.FC = () => {
  return (
    <View style={styles.detailRow}>
      <Skeleton width="40%" height={16} />
      <Skeleton width="50%" height={16} />
    </View>
  );
};

/**
 * Check-in History Item Skeleton
 * For check-in history lists
 */
export const SkeletonCheckInItem: React.FC = () => {
  return (
    <View style={styles.checkInItem}>
      <View style={styles.checkInLeft}>
        <SkeletonCircle size={12} style={{ marginRight: spacing.md }} />
        <View>
          <Skeleton width={80} height={16} style={{ marginBottom: spacing.xs }} />
          <Skeleton width={60} height={12} />
        </View>
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
  );
};

/**
 * Stats Container Skeleton
 * For statistics sections
 */
export const SkeletonStats: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.statsContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.statBox}>
          <Skeleton width={40} height={32} style={{ marginBottom: spacing.xs }} />
          <Skeleton width={60} height={12} />
        </View>
      ))}
    </View>
  );
};

/**
 * Form Field Skeleton
 * For form loading states
 */
export const SkeletonFormField: React.FC = () => {
  return (
    <View style={styles.formField}>
      <Skeleton width={100} height={14} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="100%" height={48} borderRadius={8} />
    </View>
  );
};

/**
 * Section Skeleton
 * Full section with title and content
 */
export const SkeletonSection: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <View style={styles.section}>
      <Skeleton width={140} height={18} style={{ marginBottom: spacing.md }} />
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonDetailRow key={index} />
      ))}
    </View>
  );
};

/**
 * Full Screen Skeleton
 * Complete loading state for detail screens
 */
export const SkeletonDetailScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Skeleton width={200} height={24} style={{ marginBottom: spacing.sm }} />
        <Skeleton width={100} height={20} borderRadius={10} />
      </View>

      {/* Sections */}
      <SkeletonSection rows={3} />
      <SkeletonSection rows={4} />
      <SkeletonSection rows={2} />
    </View>
  );
};

/**
 * List Screen Skeleton
 * Complete loading state for list screens
 */
export const SkeletonListScreen: React.FC<{ count?: number; showAvatar?: boolean }> = ({
  count = 5,
  showAvatar = true,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListItem key={index} showAvatar={showAvatar} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    marginRight: spacing.md,
  },
  listContent: {
    flex: 1,
  },
  listRight: {
    marginLeft: spacing.md,
  },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profile: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkInItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formField: {
    marginBottom: spacing.lg,
  },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    marginTop: spacing.md,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
