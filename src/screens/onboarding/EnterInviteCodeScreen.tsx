/**
 * Enter Invite Code Screen
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import {CodeInput} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EnterInviteCode'>;

const EnterInviteCodeScreen: React.FC<Props> = ({navigation}) => {
  const [code, setCode] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.headline}>Enter your invite code</Text>
        <Text style={styles.subheadline}>
          Check the email you received
        </Text>
        <CodeInput
          length={6}
          value={code}
          onChange={setCode}
          secureTextEntry={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {padding: spacing.md},
  backButton: {padding: spacing.sm},
  content: {flex: 1, padding: spacing.lg, alignItems: 'center'},
  headline: {...typography.h2, marginBottom: spacing.xs},
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
});

export default EnterInviteCodeScreen;
