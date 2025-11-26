/**
 * Offline Indicator Component
 * Item 28: Implement Offline Mode (LOW)
 *
 * Displays a banner when the user is offline
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { colors, typography, spacing } from '../theme';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isConnected } = useOfflineMode();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.container} testID="offline-indicator">
      <Icon name="wifi-off" size={16} color={colors.textInverse} />
      <Text style={styles.text}>
        {isConnected ? 'No internet connection' : 'You are offline'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
