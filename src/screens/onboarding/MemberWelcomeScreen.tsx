/**
 * Member Welcome Screen
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MemberWelcome'>;

const MemberWelcomeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { contactName } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headline}>Welcome to Pruuf!</Text>
        <Text style={styles.body}>
          {contactName} invited you to Pruuf. They'll receive a daily notification
          when you check in, so they know you're okay.
        </Text>
        <Text style={styles.instruction}>Your job is simple:</Text>
        <Text style={styles.step}>1. Tap "I'm OK" once a day</Text>
        <Text style={styles.step}>2. That's it!</Text>
      </View>
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('EnterInviteCode')}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  headline: { ...typography.h1, textAlign: 'center', marginBottom: spacing.lg },
  body: { ...typography.body, textAlign: 'center', marginBottom: spacing.xl },
  instruction: { ...typography.h3, marginBottom: spacing.md },
  step: { ...typography.body, marginBottom: spacing.sm, marginLeft: spacing.md },
  footer: { padding: spacing.lg },
});

export default MemberWelcomeScreen;
