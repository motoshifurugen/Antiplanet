import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  ActionSheetIOS,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/UI/Screen';
import { Toast, ToastType } from '../components/UI/Toast';
import { Icon } from '../components/UI/Icon';
import { useAppStore } from '../stores';
import { formatRemainingDays } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';
import { ui } from '../theme/ui';
import { strings } from '../i18n/strings';

type PlanetSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PlanetSettings'
>;

interface PlanetSettingsScreenProps {
  navigation: PlanetSettingsScreenNavigationProp;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const PlanetSettingsScreen: React.FC<PlanetSettingsScreenProps> = ({
  navigation,
}) => {
  const { planetGoal, loading, loadPlanetGoal, savePlanetGoal, civilizations } = useAppStore();

  const [goalTitle, setGoalTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDeadline, setOriginalDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Generate year options (current year + 10 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years;
  };

  // Generate month options (1-12)
  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  };

  // Generate day options based on selected year and month
  const generateDayOptions = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  // Update deadline string when year, month, or day changes
  useEffect(() => {
    const monthStr = selectedMonth.toString().padStart(2, '0');
    const dayStr = selectedDay.toString().padStart(2, '0');
    const newDeadline = `${selectedYear}-${monthStr}-${dayStr}`;
    setDeadline(newDeadline);
  }, [selectedYear, selectedMonth, selectedDay]);

  // Load planet goal when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only load if we don't have data and we're not currently loading
      if (!planetGoal && !loading) {
        loadPlanetGoal().catch(error => {
          console.error('Failed to load planet goal:', error);
          showToast('Failed to load planet goal', 'error');
        });
      }
    }, [loadPlanetGoal, planetGoal, loading])
  );

  // Update form fields when planet goal changes
  useEffect(() => {
    if (planetGoal) {
      setGoalTitle(planetGoal.title);
      setDeadline(planetGoal.deadline);
      setOriginalTitle(planetGoal.title);
      setOriginalDeadline(planetGoal.deadline);
      
      // Parse deadline and set picker values
      if (planetGoal.deadline) {
        const [year, month, day] = planetGoal.deadline.split('-').map(Number);
        if (year && month && day) {
          setSelectedYear(year);
          setSelectedMonth(month);
          setSelectedDay(day);
        }
      }
      setIsInitialized(true);
    } else {
      setGoalTitle('');
      setDeadline('');
      setOriginalTitle('');
      setOriginalDeadline('');
      
      // Reset to current date
      const now = new Date();
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth() + 1);
      setSelectedDay(now.getDate());
      setIsInitialized(true);
    }
    setErrors({}); // Clear errors when loading new data
  }, [planetGoal]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!goalTitle.trim()) {
      newErrors.title = strings.form.titleRequired;
    }

    if (!deadline.trim()) {
      newErrors.deadline = strings.form.deadlineRequired;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      newErrors.deadline = strings.form.invalidDate;
    } else {
      const date = new Date(deadline);
      if (isNaN(date.getTime())) {
        newErrors.deadline = strings.form.invalidDate;
      }
      
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        newErrors.deadline = strings.form.pastDate;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = (): boolean => {
    return goalTitle.trim() !== originalTitle || deadline !== originalDeadline;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await savePlanetGoal({
        title: goalTitle.trim(),
        deadline,
      });

      setOriginalTitle(goalTitle.trim());
      setOriginalDeadline(deadline);
      showToast(strings.messages.planetGoalSaved, 'success');
      
      // Check if this is the first time setting up the planet and no civilizations exist
      if (civilizations.length === 0) {
        // Navigate to civilizations screen after a short delay to show the toast
        setTimeout(() => {
          navigation.navigate('Civilizations');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to save planet goal:', error);
      showToast('惑星目標を保存できませんでした。接続を確認して再試行してください。', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setGoalTitle(originalTitle);
    setDeadline(originalDeadline);
    setErrors({});
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
                  options: [...years.map(year => year.toString()), strings.actions.cancel],
        cancelButtonIndex: years.length,
                  title: strings.datePicker.selectYear,
        message: strings.datePicker.yearMessage,
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
        strings.datePicker.selectYear,
        strings.datePicker.yearMessage,
        [
          ...yearOptions,
          { text: strings.actions.cancel, style: 'cancel' as const },
        ]
      );
    }
  };

  const showMonthPicker = () => {
    const months = strings.datePicker.months;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
                  options: [...months, strings.actions.cancel],
        cancelButtonIndex: months.length,
                  title: strings.datePicker.selectMonth,
        message: strings.datePicker.monthMessage,
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
        strings.datePicker.selectMonth,
        strings.datePicker.monthMessage,
        [
          ...monthOptions,
          { text: strings.actions.cancel, style: 'cancel' as const },
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
                  options: [...days.map(day => day.toString()), strings.actions.cancel],
        cancelButtonIndex: days.length,
                  title: strings.datePicker.selectDay,
        message: strings.datePicker.dayMessage,
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
                  { text: strings.datePicker.previous10, onPress: () => showDayGroup(dayGroups[startIndex - 1] || [], startIndex - 1) },
        { text: strings.datePicker.next10, onPress: () => showDayGroup(dayGroups[startIndex + 1] || [], startIndex + 1) },
          { text: strings.actions.cancel, style: 'cancel' as const },
        ].filter((_, index) => {
          if (startIndex === 0 && index === dayOptions.length + 1) return false; // Hide "前の10件" for first group
          if (startIndex === dayGroups.length - 1 && index === dayOptions.length + 2) return false; // Hide "次の10件" for last group
          return true;
        });

              Alert.alert(
        strings.datePicker.selectDay,
        strings.datePicker.dayMessage,
          buttons
        );
      };

      showDayGroup(dayGroups[0], 0);
    }
  };

  if (loading && !planetGoal && !isInitialized) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{strings.messages.loading.vision}</Text>
        </View>
        <Toast {...toast} onHide={hideToast} />
      </Screen>
    );
  }

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>{strings.screens.planetSettings.title}</Text>
          <Text style={styles.subtitle}>{strings.screens.planetSettings.subtitle}</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{strings.screens.planetSettings.fields.vision} *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={goalTitle}
                onChangeText={text => {
                  setGoalTitle(text);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                placeholder="2026年までに海外で働く"
                placeholderTextColor={colors.placeholder}
                editable={!saving}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{strings.screens.planetSettings.fields.deadline} *</Text>
              <View style={styles.dateSelectorContainer}>
                {/* Year Selector */}
                <View style={styles.dateSelectorGroup}>
                  <Text style={styles.dateSelectorLabel}>{strings.datePicker.year}</Text>
                  <TouchableOpacity
                    style={styles.dateSelectorButton}
                    onPress={showYearPicker}
                    disabled={saving}
                  >
                    <View style={styles.dateSelectorRow}>
                      <Text style={styles.dateSelectorValue}>{selectedYear}</Text>
                      <Icon name="edit" size="sm" color={colors.textSecondary} style={styles.dateSelectorIcon} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Month Selector */}
                <View style={styles.dateSelectorGroup}>
                  <Text style={styles.dateSelectorLabel}>{strings.datePicker.month}</Text>
                  <TouchableOpacity
                    style={styles.dateSelectorButton}
                    onPress={showMonthPicker}
                    disabled={saving}
                  >
                    <View style={styles.dateSelectorRow}>
                      <Text style={styles.dateSelectorValue}>{selectedMonth.toString().padStart(2, '0')}</Text>
                      <Icon name="edit" size="sm" color={colors.textSecondary} style={styles.dateSelectorIcon} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Day Selector */}
                <View style={styles.dateSelectorGroup}>
                  <Text style={styles.dateSelectorLabel}>{strings.datePicker.day}</Text>
                  <TouchableOpacity
                    style={styles.dateSelectorButton}
                    onPress={showDayPicker}
                    disabled={saving}
                  >
                    <View style={styles.dateSelectorRow}>
                      <Text style={styles.dateSelectorValue}>{selectedDay.toString().padStart(2, '0')}</Text>
                      <Icon name="edit" size="sm" color={colors.textSecondary} style={styles.dateSelectorIcon} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
              {deadline && !errors.deadline && (
                <Text style={styles.helperText}>{formatRemainingDays(deadline)}</Text>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.resetButton, !hasChanges() && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={!hasChanges() || saving}
              >
                <Icon name="delete" size="sm" color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, (!hasChanges() || saving) && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={!hasChanges() || saving}
              >
                {saving ? (
                  <Icon name="clock" size="sm" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="save" size="sm" color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={[styles.saveButtonText, !hasChanges() && styles.buttonTextDisabled]}>
                      {strings.actions.save}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Toast {...toast} onHide={hideToast} />
        </View>
      </TouchableWithoutFeedback>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    flex: 1,
    padding: spacing.md,
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
    color: colors.text,
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
  helperText: {
    color: colors.textTertiary,
    ...typography.small,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  resetButton: {
    ...ui.button.outline,
    flex: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  saveButton: {
    ...ui.button.primary,
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  saveButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonTextDisabled: {
    color: colors.textTertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.sm,
  },
  dateSelectorGroup: {
    alignItems: 'center',
  },
  dateSelectorLabel: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateSelectorButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 120, // Fixed width for buttons
  },
  dateSelectorButton: {
    padding: spacing.xs,
  },
  dateSelectorValue: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    minWidth: 40, // Fixed width for value
    marginRight: 0,
  },
  dateSelectorIcon: {
    marginLeft: spacing.xs,
    marginTop: 0,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
