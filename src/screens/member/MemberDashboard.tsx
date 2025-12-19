/**
 * Member Dashboard
 * Main screen with "I'm OK" check-in button
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import {Feather as Icon} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {colors, typography, spacing, borderRadius, shadows} from '../../theme';
import {useAppSelector, useAppDispatch} from '../../store';
import {fetchContacts, performCheckIn} from '../../store/slices/memberSlice';

type NavigationProp = NativeStackNavigationProp<any>;

const MemberDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.auth.user);
  const contacts = useAppSelector(state => state.member.contacts);
  const isLoading = useAppSelector(state => state.member.isLoading);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

  // Load contacts on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchContacts(user.id));
    }
  }, [dispatch, user?.id]);

  // Breathing animation for button
  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  const handleCheckIn = async () => {
    if (!user) {
      return;
    }

    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await dispatch(performCheckIn({memberId: user.id, timezone})).unwrap();
      setHasCheckedIn(true);
      Alert.alert(
        'Great job!',
        'You checked in. Your contacts have been notified.',
      );
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to check in. Please try again.');
    }
  };

  const onRefresh = async () => {
    if (!user?.id) {
      return;
    }
    setRefreshing(true);
    try {
      await dispatch(fetchContacts(user.id)).unwrap();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* Deadline Banner */}
        <View style={styles.banner}>
          <Icon name="clock" size={24} color={colors.accent} />
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              Next check-in: Today at 10:00 AM
            </Text>
            <Text style={styles.bannerSubtitle}>in 2 hours 34 minutes</Text>
          </View>
          <View style={styles.timezoneBadge}>
            <Text style={styles.timezoneText}>PST</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* I'm OK Button */}
          <Animated.View
            style={[styles.buttonContainer, {transform: [{scale: scaleAnim}]}]}>
            <TouchableOpacity
              style={[
                styles.checkInButton,
                hasCheckedIn && styles.checkInButtonDone,
              ]}
              onPress={handleCheckIn}
              disabled={isLoading || hasCheckedIn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="I'm OK"
              accessibilityHint="Double tap to confirm you're okay today">
              {hasCheckedIn ? (
                <>
                  <Icon name="check" size={48} color={colors.textInverse} />
                  <Text style={styles.buttonText}>Checked In!</Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>I'm OK</Text>
                  <Text style={styles.buttonSubtext}>Tap to check in</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Last check-in status */}
          {hasCheckedIn && (
            <View style={styles.statusCard}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.statusText}>
                You checked in today at 9:45 AM
              </Text>
            </View>
          )}
        </View>

        {/* Contacts section */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Your Contacts</Text>
          {contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="users" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyStateText}>No contacts yet</Text>
            </View>
          ) : (
            contacts.map(contact => (
              <TouchableOpacity
                key={contact.id}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('ContactDetail', {
                    contactId: contact.id,
                    contactName: contact.name,
                  })
                }>
                <View style={styles.contactCard}>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <View style={styles.statusBadge}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              contact.status === 'active'
                                ? colors.success
                                : colors.warning,
                          },
                        ]}
                      />
                      <Text style={styles.statusLabel}>{contact.status}</Text>
                    </View>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon name="phone" size={20} color={colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Icon
                        name="message-circle"
                        size={20}
                        color={colors.accent}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.accentLight,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  bannerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  bannerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  timezoneBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  timezoneText: {
    ...typography.caption,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  checkInButton: {
    width: '90%',
    height: 120,
    backgroundColor: colors.primaryDark, // Using darker green for better contrast
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  checkInButtonDone: {
    backgroundColor: colors.success,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
  },
  buttonSubtext: {
    ...typography.bodySmall,
    color: colors.textInverse,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.lg,
  },
  statusText: {
    ...typography.bodySmall,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
  },
  contactsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.body,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.md, // Increased for 60pt touch target
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});

export default MemberDashboard;
