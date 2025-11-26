/**
 * Set Check-in Time Screen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SetCheckInTime'>;

const SetCheckInTimeScreen: React.FC<Props> = ({ navigation }) => {
  const [time, setTime] = useState('10:00');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>When should we remind you?</Text>
        <Text style={styles.subheadline}>Choose a time for your daily check-in</Text>
        <Text style={styles.timeDisplay}>{time} AM</Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('MainTabs')}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  headline: { ...typography.h2, marginBottom: spacing.xs, textAlign: 'center' },
  subheadline: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  timeDisplay: { ...typography.h1, fontSize: 48, color: colors.primary },
  footer: { padding: spacing.lg },
});

export default SetCheckInTimeScreen;
