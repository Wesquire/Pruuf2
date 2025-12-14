/**
 * Add Member Screen
 * Contact adds a member to monitor
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Button, TextInput } from '../../components/common';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AddMember'>;

const AddMemberScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Basic email validation
  const isValidEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const isValid = name.length >= 2 && isValidEmail(email);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Icon name="x" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add a Member</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.headline}>
          Who would you like to check on daily?
        </Text>
        <Text style={styles.subheadline}>
          We'll send them an invite to join Pruuf
        </Text>

        <TextInput
          label="Member's Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Mom, Grandma, Aunt Sarah"
        />

        <TextInput
          label="Member's Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="member@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={() => navigation.navigate('ReviewMember', { name, email })}
          variant="primary"
          size="large"
          disabled={!isValid}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  closeButton: { padding: spacing.sm },
  title: { ...typography.h3, marginLeft: spacing.md },
  content: { flex: 1, padding: spacing.lg },
  headline: { ...typography.h2, marginBottom: spacing.xs },
  subheadline: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  footer: { padding: spacing.lg },
});

export default AddMemberScreen;
