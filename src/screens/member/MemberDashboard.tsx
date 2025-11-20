/**
 * Member Dashboard
 * Main screen with "I'm OK" check-in button
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAppSelector } from '../../store';

type NavigationProp = NativeStackNavigationProp<any>;

const MemberDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAppSelector(state => state.auth.user);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];

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
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  const handleCheckIn = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setHasCheckedIn(true);
      Alert.alert('Great job!', 'You checked in. Your contacts have been notified.');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Deadline Banner */}
      <View style={styles.banner}>
        <Icon name="clock" size={24} color={colors.accent} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Next check-in: Today at 10:00 AM</Text>
          <Text style={styles.bannerSubtitle}>in 2 hours 34 minutes</Text>
        </View>
        <View style={styles.timezoneBadge}>
          <Text style={styles.timezoneText}>PST</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* I'm OK Button */}
        <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.checkInButton, hasCheckedIn && styles.checkInButtonDone]}
            onPress={handleCheckIn}
            disabled={isLoading || hasCheckedIn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="I'm OK"
            accessibilityHint="Double tap to confirm you're okay today"
          >
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
            <Text style={styles.statusText}>You checked in today at 9:45 AM</Text>
          </View>
        )}
      </View>

      {/* Contacts section */}
      <View style={styles.contactsSection}>
        <Text style={styles.sectionTitle}>Your Contacts</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('ContactDetail', {
              contactId: '1',
              contactName: 'Jennifer',
            })
          }
        >
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>Jennifer</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusLabel}>Active</Text>
              </View>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="phone" size={20} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Icon name="message-circle" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
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
    padding: spacing.sm,
  },
});

export default MemberDashboard;
