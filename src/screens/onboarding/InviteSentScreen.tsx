/**
 * Invite Sent Screen
 */
import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import {Button, Card} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'InviteSent'>;

const InviteSentScreen: React.FC<Props> = ({navigation, route}) => {
  const {name, inviteCode} = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Icon name="check-circle" size={80} color={colors.success} />
        <Text style={styles.headline}>Invite sent to {name}!</Text>

        <Card style={styles.codeCard}>
          <Text style={styles.codeLabel}>Their invite code:</Text>
          <Text style={styles.code}>{inviteCode}</Text>
        </Card>

        <Text style={styles.hint}>
          You might want to call {name} to let them know the text is coming.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Go to Dashboard"
          onPress={() => navigation.navigate('MainTabs')}
          variant="primary"
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {...typography.h1, textAlign: 'center', marginVertical: spacing.lg},
  codeCard: {alignItems: 'center', marginBottom: spacing.lg},
  codeLabel: {...typography.bodySmall, color: colors.textSecondary},
  code: {...typography.h1, color: colors.primary, marginTop: spacing.xs},
  hint: {...typography.body, color: colors.textSecondary, textAlign: 'center'},
  footer: {padding: spacing.lg},
});

export default InviteSentScreen;
