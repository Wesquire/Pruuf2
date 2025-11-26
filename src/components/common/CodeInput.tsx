/**
 * CodeInput Component
 * Input boxes for verification codes and PINs
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { colors, spacing, borderRadius, touchTargets } from '../../theme';

interface CodeInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  secureTextEntry?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  testID?: string;
}

export const CodeInput: React.FC<CodeInputProps> = ({
  length,
  value,
  onChange,
  secureTextEntry = false,
  error = false,
  autoFocus = true,
  testID,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous input
        inputRefs.current[index - 1]?.focus();
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
      } else {
        // Clear current input
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      }
    }
  };

  const handleChange = (index: number, text: string) => {
    // Handle paste
    if (text.length > 1) {
      const pastedValue = text.slice(0, length);
      onChange(pastedValue);
      if (pastedValue.length === length) {
        Keyboard.dismiss();
      } else {
        inputRefs.current[pastedValue.length]?.focus();
      }
      return;
    }

    // Handle single character
    if (text.length === 1) {
      const newValue = value.slice(0, index) + text + value.slice(index + 1);
      onChange(newValue.slice(0, length));

      // Auto-advance or dismiss keyboard
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (newValue.length === length) {
        Keyboard.dismiss();
      }
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={ref => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            focusedIndex === index && styles.inputFocused,
            error && styles.inputError,
          ]}
          value={secureTextEntry && value[index] ? '•' : value[index] || ''}
          onChangeText={text => handleChange(index, text)}
          onKeyPress={({ nativeEvent }) =>
            handleKeyPress(index, nativeEvent.key)
          }
          onFocus={() => setFocusedIndex(index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          accessible={true}
          accessibilityLabel={`Digit ${index + 1} of ${length}`}
          accessibilityHint={
            secureTextEntry
              ? 'Enter PIN digit'
              : 'Enter verification code digit'
          }
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  input: {
    width: touchTargets.standard,
    height: touchTargets.standard,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.error,
  },
});

export default CodeInput;
