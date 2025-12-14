/**
 * Font Size Screen
 * User selects their preferred text size
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
import {Feather as Icon} from '@expo/vector-icons';
import {Button} from '../../components/common';
import {colors, typography, spacing, borderRadius} from '../../theme';
import {RootStackParamList, FontSizePreference} from '../../types';
import {usersAPI} from '../../services/api';
import {storage} from '../../services/storage';

type Props = NativeStackScreenProps<RootStackParamList, 'FontSize'>;

const fontOptions: {
  value: FontSizePreference;
  label: string;
  multiplier: number;
}[] = [
  {value: 'standard', label: 'Standard', multiplier: 1.0},
  {value: 'large', label: 'Large', multiplier: 1.25},
  {value: 'extra_large', label: 'Extra Large', multiplier: 1.5},
];

const FontSizeScreen: React.FC<Props> = ({navigation, route}) => {
  const {isOnboarding} = route.params;
  const [selected, setSelected] = useState<FontSizePreference>('standard');
  const [isLoading, setIsLoading] = useState(false);

  const getPreviewStyle = () => {
    const multiplier =
      fontOptions.find(o => o.value === selected)?.multiplier || 1;
    return {
      fontSize: 16 * multiplier,
      lineHeight: 22 * multiplier,
    };
  };

  const getButtonStyle = () => {
    const multiplier =
      fontOptions.find(o => o.value === selected)?.multiplier || 1;
    return {
      fontSize: 16 * multiplier,
    };
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await storage.setFontSize(selected);
      await usersAPI.updateFontSize(selected);

      if (isOnboarding) {
        // Navigate to trial welcome (Contact flow)
        navigation.navigate('TrialWelcome');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving font size:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {!isOnboarding && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon name="chevron-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={styles.progress}>Step 4 of 6</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.headline}>Choose your text size</Text>
        <Text style={styles.subheadline}>
          You can change this anytime in Settings
        </Text>

        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={[styles.previewText, getPreviewStyle()]}>
            This is how Pruuf will look. Buttons and text will match this size.
          </Text>
          <View style={styles.previewButton}>
            <Text style={[styles.previewButtonText, getButtonStyle()]}>
              I'm OK
            </Text>
          </View>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {fontOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selected === option.value && styles.optionSelected,
              ]}
              onPress={() => setSelected(option.value)}
              accessible={true}
              accessibilityRole="radio"
              accessibilityState={{selected: selected === option.value}}
              accessibilityLabel={option.label}>
              <View style={styles.radio}>
                {selected === option.value && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
          size="large"
          loading={isLoading}
          testID="font-size-continue-button"
        />
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
  },
  headline: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subheadline: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  previewCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  previewText: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  previewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  previewButtonText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 60,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
  },
});

export default FontSizeScreen;
