/**
 * Review Member Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Button, Card } from '../../components/common';
import { colors, typography, spacing } from '../../theme';
import { RootStackParamList } from '../../types';
import { membersAPI, formatPhoneDisplay } from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewMember'>;

const ReviewMemberScreen: React.FC<Props> = ({ navigation, route }) => {
  const { name, phone } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const handleSendInvite = async () => {
    setIsLoading(true);
    try {
      const result = await membersAPI.invite(name, phone);
      if (result.success && result.member) {
        navigation.navigate('InviteSent', {
          name,
          phone,
          inviteCode: result.member.invite_code || '',
        });
      }
    } catch (error) {
      console.error('Error sending invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Details</Text>
      </View>

      <View style={styles.content}>
        <Card>
          <Text style={styles.label}>You're about to invite:</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.phone}>{formatPhoneDisplay(phone)}</Text>
        </Card>

        <Text style={styles.infoText}>We'll send {name} a text message with:</Text>
        <View style={styles.bulletPoints}>
          <Text style={styles.bullet}>• Instructions to download Pruuf</Text>
          <Text style={styles.bullet}>• A unique invite code to connect with you</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Send Invite"
          onPress={handleSendInvite}
          variant="primary"
          size="large"
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  backButton: { padding: spacing.sm },
  title: { ...typography.h3, marginLeft: spacing.md },
  content: { flex: 1, padding: spacing.lg },
  label: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xs },
  name: { ...typography.h2, marginBottom: spacing.xs },
  phone: { ...typography.body, color: colors.textSecondary },
  infoText: { ...typography.body, marginTop: spacing.xl, marginBottom: spacing.md },
  bulletPoints: { marginLeft: spacing.md },
  bullet: { ...typography.body, marginBottom: spacing.xs },
  footer: { padding: spacing.lg },
});

export default ReviewMemberScreen;
