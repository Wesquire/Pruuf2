/**
 * TextInput Component
 * Accessible text input with label and error states
 */

import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {colors, typography, spacing, borderRadius} from '../../theme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  testID?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  containerStyle,
  inputStyle,
  testID,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessible={true}>
          {label}
        </Text>
      )}

      <RNTextInput
        style={[styles.input, error && styles.inputError, inputStyle]}
        placeholderTextColor={colors.textSecondary}
        accessible={true}
        accessibilityLabel={label || props.placeholder}
        testID={testID}
        {...props}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.label.fontSize,
    fontWeight: typography.label.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    color: colors.error,
    marginLeft: spacing.xs,
  },
});

export default TextInput;
