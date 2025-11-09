// Modal for adding/editing civilizations

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { Civilization, CreateCivilizationRequest, UpdateCivilizationRequest } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';
import { animations, createAnimation } from '../theme/animations';
import { Screen } from '../components/UI/Screen';
import { Toast, ToastType } from '../components/UI/Toast';
import { Icon } from '../components/UI/Icon';

interface CivilizationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCivilizationRequest | UpdateCivilizationRequest) => Promise<void>;
  civilization?: Civilization;
  loading?: boolean;
}

export const CivilizationModal: React.FC<CivilizationModalProps> = ({
  visible,
  onClose,
  onSubmit,
  civilization,
  loading = false,
}) => {
  const [name, setName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [dailyTask, setDailyTask] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Update deadline string when year, month, or day changes
  useEffect(() => {
    const monthStr = selectedMonth.toString().padStart(2, '0');
    const dayStr = selectedDay.toString().padStart(2, '0');
    const newDeadline = `${selectedYear}-${monthStr}-${dayStr}`;
    setDeadline(newDeadline);
  }, [selectedYear, selectedMonth, selectedDay]);

  // Reset form when modal opens/closes or civilization changes
  useEffect(() => {
    if (visible) {
      setName(civilization?.name || '');
      setDeadline(civilization?.deadline || '');
      setDailyTask(civilization?.purpose || ''); // Use purpose field for daily task
      setErrors({});
      
      // Parse deadline and set picker values
      if (civilization?.deadline) {
        const [year, month, day] = civilization.deadline.split('-').map(Number);
        if (year && month && day) {
          setSelectedYear(year);
          setSelectedMonth(month);
          setSelectedDay(day);
        }
      } else {
        // Reset to current date
        const now = new Date();
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth() + 1);
        setSelectedDay(now.getDate());
      }
      
      // Start entrance animation
      Animated.parallel([
        createAnimation('fadeIn', fadeAnim),
        createAnimation('slideUp', slideAnim),
        createAnimation('growth', scaleAnim),
      ]).start();
    } else {
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
      scaleAnim.setValue(0.8);
    }
  }, [visible, civilization, fadeAnim, slideAnim, scaleAnim]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'タイトルは必須です';
    }

    if (!deadline.trim()) {
      newErrors.deadline = '期限は必須です';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      newErrors.deadline = '無効な日付形式です';
    } else {
      const date = new Date(deadline);
      if (isNaN(date.getTime())) {
        newErrors.deadline = '無効な日付です';
      }
      
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        newErrors.deadline = '期限は今日以降の日付を選択してください';
      }
    }

    // dailyTask is optional, so no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        name: name.trim(),
        deadline,
        purpose: dailyTask.trim(), // Store daily task in purpose field
        state: civilization?.state || 'uninitialized',
      } as CreateCivilizationRequest | UpdateCivilizationRequest;

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to submit civilization:', error);
      // Error handling is done by parent component
    }
  };

  const showYearPicker = () => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i);
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...years.map(year => year.toString()), 'キャンセル'],
          cancelButtonIndex: years.length,
          title: '年を選択',
          message: '文明の期限年を選択してください',
        },
        (buttonIndex) => {
          if (buttonIndex !== years.length) {
            setSelectedYear(years[buttonIndex]);
            if (errors.deadline) {
              setErrors(prev => ({ ...prev, deadline: '' }));
            }
          }
        }
      );
    } else {
      // Android: Alert with buttons
      const yearOptions = years.map(year => ({
        text: year.toString(),
        onPress: () => {
          setSelectedYear(year);
          if (errors.deadline) {
            setErrors(prev => ({ ...prev, deadline: '' }));
          }
        },
      }));

      Alert.alert(
        '年を選択',
        '文明の期限年を選択してください',
        [
          ...yearOptions,
          { text: 'キャンセル', style: 'cancel' as const },
        ]
      );
    }
  };

  const showMonthPicker = () => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...months, 'キャンセル'],
          cancelButtonIndex: months.length,
          title: '月を選択',
          message: '文明の期限月を選択してください',
        },
        (buttonIndex) => {
          if (buttonIndex !== months.length) {
            const newMonth = buttonIndex + 1;
            setSelectedMonth(newMonth);
            setSelectedDay(1); // Reset day when month changes
            if (errors.deadline) {
              setErrors(prev => ({ ...prev, deadline: '' }));
            }
          }
        }
      );
    } else {
      // Android: Alert with buttons
      const monthOptions = months.map((month, index) => ({
        text: month,
        onPress: () => {
          const newMonth = index + 1;
          setSelectedMonth(newMonth);
          setSelectedDay(1); // Reset day when month changes
          if (errors.deadline) {
            setErrors(prev => ({ ...prev, deadline: '' }));
          }
        },
      }));

      Alert.alert(
        '月を選択',
        '文明の期限月を選択してください',
        [
          ...monthOptions,
          { text: 'キャンセル', style: 'cancel' as const },
        ]
      );
    }
  };

  const showDayPicker = () => {
    const maxDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const days: number[] = [];
    for (let i = 1; i <= maxDays; i++) {
      days.push(i);
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...days.map(day => day.toString()), 'キャンセル'],
          cancelButtonIndex: days.length,
          title: '日を選択',
          message: '文明の期限日を選択してください',
        },
        (buttonIndex) => {
          if (buttonIndex !== days.length) {
            setSelectedDay(days[buttonIndex]);
            if (errors.deadline) {
              setErrors(prev => ({ ...prev, deadline: '' }));
            }
          }
        }
      );
    } else {
      // Android: Alert with buttons (grouped by 10s for better UX)
      const dayGroups: number[][] = [];
      for (let i = 0; i < days.length; i += 10) {
        dayGroups.push(days.slice(i, i + 10));
      }

      const showDayGroup = (dayGroup: number[], startIndex: number) => {
        const dayOptions = dayGroup.map(day => ({
          text: day.toString(),
          onPress: () => {
            setSelectedDay(day);
            if (errors.deadline) {
              setErrors(prev => ({ ...prev, deadline: '' }));
            }
          },
        }));

        const buttons = [
          ...dayOptions,
          { text: '前の10件', onPress: () => showDayGroup(dayGroups[startIndex - 1] || [], startIndex - 1) },
          { text: '次の10件', onPress: () => showDayGroup(dayGroups[startIndex + 1] || [], startIndex + 1) },
          { text: 'キャンセル', style: 'cancel' as const },
        ].filter((_, index) => {
          if (startIndex === 0 && index === dayOptions.length + 1) return false; // Hide "前の10件" for first group
          if (startIndex === dayGroups.length - 1 && index === dayOptions.length + 2) return false; // Hide "次の10件" for last group
          return true;
        });

        Alert.alert(
          '日を選択',
          '文明の期限日を選択してください',
          buttons
        );
      };

      showDayGroup(dayGroups[0], 0);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <View style={styles.modalContentInner}>
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {civilization ? 'Civilizationを編集' : 'Civilizationを追加'}
                  </Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Icon name="edit" size="sm" color={colors.primary} style={styles.closeButtonIcon} />
                    <Text style={styles.closeButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>タイトル *</Text>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Civilizationのタイトルを入力"
                      placeholderTextColor={colors.placeholder}
                      editable={!loading}
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>期限 *</Text>
                    <View style={styles.dateSelectorContainer}>
                      {/* Year Selector */}
                      <View style={styles.dateSelectorGroup}>
                        <Text style={styles.dateSelectorLabel}>年</Text>
                        <TouchableOpacity
                          style={styles.dateSelectorButton}
                          onPress={showYearPicker}
                          disabled={loading}
                        >
                          <View style={styles.dateSelectorRow}>
                            <Text style={styles.dateSelectorValue}>{selectedYear}</Text>
                            <Icon name="edit" size="sm" color={colors.textSecondary} style={styles.dateSelectorIcon} />
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Month Selector */}
                      <View style={styles.dateSelectorGroup}>
                        <Text style={styles.dateSelectorLabel}>月</Text>
                        <TouchableOpacity
                          style={styles.dateSelectorButton}
                          onPress={showMonthPicker}
                          disabled={loading}
                        >
                          <View style={styles.dateSelectorRow}>
                            <Text style={styles.dateSelectorValue}>{selectedMonth.toString().padStart(2, '0')}</Text>
                            <Icon name="edit" size="sm" color={colors.textSecondary} style={styles.dateSelectorIcon} />
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Day Selector */}
                      <View style={styles.dateSelectorGroup}>
                        <Text style={styles.dateSelectorLabel}>日</Text>
                        <TouchableOpacity
                          style={styles.dateSelectorButton}
                          onPress={showDayPicker}
                          disabled={loading}
                        >
                          <View style={styles.dateSelectorRow}>
                            <Text style={styles.dateSelectorValue}>{selectedDay.toString().padStart(2, '0')}</Text>
                            <Icon name="edit" size="sm" color={colors.textSecondary} style={styles.dateSelectorIcon} />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>日々の小さな一歩</Text>
                    <TextInput
                      style={styles.input}
                      value={dailyTask}
                      onChangeText={setDailyTask}
                      placeholder="毎日できる小さな行動を入力"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      numberOfLines={3}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name={loading ? 'clock' : civilization ? 'save' : 'add'} 
                      size="sm" 
                      color="#FFFFFF" 
                      style={styles.submitButtonIcon} 
                    />
                    <Text style={styles.submitButtonText}>
                      {loading ? '保存中...' : civilization ? '更新' : '作成'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    ...ui.modal,
    width: '90%',
    maxWidth: 500,
    minWidth: 400,
    maxHeight: '90%',
    minHeight: 600,
  },
  modalContentInner: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeButtonIcon: {
    marginRight: spacing.xs,
  },
  closeButtonText: {
    ...typography.button,
    color: colors.primary,
  },
  form: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...ui.input,
    ...typography.body,
    color: colors.text,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  inputError: {
    ...ui.inputError,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    ...typography.small,
    marginTop: spacing.xs / 2,
  },
  submitButton: {
    ...ui.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
    width: '100%',
  },
  submitButtonIcon: {
    marginRight: spacing.xs,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 70,
    marginBottom: spacing.sm,
  },
  dateSelectorGroup: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  dateSelectorLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  dateSelectorButton: {
    padding: spacing.sm,
    borderRadius: spacing.xs,
    minWidth: 60,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dateSelectorValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 40,
  },
  dateSelectorIcon: {
    marginLeft: 0,
    marginTop: 0,
  },
  buttonContainer: {
    padding: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
});
