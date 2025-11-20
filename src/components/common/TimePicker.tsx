/**
 * Time Picker Component
 * Accessible time selection for check-in time
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface TimePickerProps {
  value: string; // Format: "HH:MM" (24-hour)
  onChange: (time: string) => void;
  label?: string;
  testID?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  testID,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempHour, setTempHour] = useState(
    value ? parseInt(value.split(':')[0]) : 10
  );
  const [tempMinute, setTempMinute] = useState(
    value ? parseInt(value.split(':')[1]) : 0
  );
  const [tempPeriod, setTempPeriod] = useState(
    tempHour >= 12 ? 'PM' : 'AM'
  );

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute intervals

  const formatDisplayTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const displayHour = hour % 12 || 12;
    const period = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${minutes.padStart(2, '0')} ${period}`;
  };

  const handleConfirm = () => {
    let hour = tempHour;
    if (tempPeriod === 'PM' && hour !== 12) {
      hour += 12;
    } else if (tempPeriod === 'AM' && hour === 12) {
      hour = 0;
    }

    const timeString = `${hour.toString().padStart(2, '0')}:${tempMinute
      .toString()
      .padStart(2, '0')}`;
    onChange(timeString);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container} testID={testID}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.picker}
        onPress={() => setModalVisible(true)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Select time, currently ${formatDisplayTime(value)}`}
      >
        <Text style={styles.pickerText}>
          {value ? formatDisplayTime(value) : 'Select time'}
        </Text>
        <Icon name="clock" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.closeButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Icon name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              {/* Hour Picker */}
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Hour</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {hours.map(hour => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.option,
                        tempHour === hour && styles.optionSelected,
                      ]}
                      onPress={() => setTempHour(hour)}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: tempHour === hour }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempHour === hour && styles.optionTextSelected,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Picker */}
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Minute</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {minutes.map(minute => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.option,
                        tempMinute === minute && styles.optionSelected,
                      ]}
                      onPress={() => setTempMinute(minute)}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: tempMinute === minute }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempMinute === minute && styles.optionTextSelected,
                        ]}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Period Picker (AM/PM) */}
              <View style={styles.column}>
                <Text style={styles.columnLabel}>Period</Text>
                <ScrollView
                  style={styles.scrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {['AM', 'PM'].map(period => (
                    <TouchableOpacity
                      key={period}
                      style={[
                        styles.option,
                        tempPeriod === period && styles.optionSelected,
                      ]}
                      onPress={() => setTempPeriod(period as 'AM' | 'PM')}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: tempPeriod === period }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempPeriod === period && styles.optionTextSelected,
                        ]}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  pickerText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: height * 0.6,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    padding: spacing.xs,
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    height: 240,
  },
  column: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  columnLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  option: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.xs,
    marginVertical: 2,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  cancelButton: {
    backgroundColor: colors.backgroundGray,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});

export default TimePicker;
