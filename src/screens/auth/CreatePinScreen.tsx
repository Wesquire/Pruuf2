/**
 * Create PIN Screen
 * User creates a 4-digit PIN
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Feather as Icon} from '@expo/vector-icons';
import {CodeInput} from '../../components/common';
import {colors, typography, spacing} from '../../theme';
import {RootStackParamList} from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePin'>;

const CreatePinScreen: React.FC<Props> = ({navigation, route}) => {
  const {phone, sessionToken} = route.params;
  const [pin, setPin] = useState('');

  // Auto-advance when PIN is complete
  useEffect(() => {
    if (pin.length === 4) {
      navigation.navigate('ConfirmPin', {phone, sessionToken, pin});
    }
  }, [pin]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.progress}>Step 3 of 6</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Create a 4-digit PIN</Text>
        <Text style={styles.subheadline}>
          You'll use this to log in to Pruuf
        </Text>

        <View style={styles.codeContainer}>
          <CodeInput
            length={4}
            value={pin}
            onChange={setPin}
            secureTextEntry={true}
            testID="create-pin-input"
          />
        </View>

        <Text style={styles.helperText}>Choose a PIN you'll remember</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    padding: spacing.sm,
  },
  progress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  headline: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: 'center',
  },
  codeContainer: {
    marginBottom: spacing.lg,
  },
  helperText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CreatePinScreen;
