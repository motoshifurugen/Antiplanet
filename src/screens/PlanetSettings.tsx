import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/UI/Screen';
import { Toast, ToastType } from '../components/UI/Toast';
import { useAppStore } from '../stores';
import { formatRemainingDays } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { RootStackParamList } from '../app/navigation/RootNavigator';

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
  navigation: _navigation,
}) => {
  const { planetGoal, loading, loadPlanetGoal, savePlanetGoal } = useAppStore();

  const [goalTitle, setGoalTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDeadline, setOriginalDeadline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Load planet goal when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPlanetGoal().catch(error => {
        console.error('Failed to load planet goal:', error);
        showToast('Failed to load planet goal', 'error');
      });
    }, [loadPlanetGoal])
  );

  // Update form fields when planet goal changes
  useEffect(() => {
    if (planetGoal) {
      setGoalTitle(planetGoal.title);
      setDeadline(planetGoal.deadline);
      setOriginalTitle(planetGoal.title);
      setOriginalDeadline(planetGoal.deadline);
    } else {
      setGoalTitle('');
      setDeadline('');
      setOriginalTitle('');
      setOriginalDeadline('');
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
      newErrors.title = 'Goal title is required';
    }

    if (!deadline.trim()) {
      newErrors.deadline = 'Deadline is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      newErrors.deadline = 'Please use YYYY-MM-DD format';
    } else {
      const date = new Date(deadline);
      if (isNaN(date.getTime())) {
        newErrors.deadline = 'Invalid date';
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
      showToast('Planet goal saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save planet goal:', error);
      showToast('Failed to save planet goal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setGoalTitle(originalTitle);
    setDeadline(originalDeadline);
    setErrors({});
  };

  if (loading && !planetGoal) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading planet goal...</Text>
        </View>
        <Toast {...toast} onHide={hideToast} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Planet Settings</Text>
        <Text style={styles.subtitle}>Configure your planet's goals and timeline</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={goalTitle}
              onChangeText={text => {
                setGoalTitle(text);
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: '' }));
                }
              }}
              placeholder="Enter your planet's main goal"
              placeholderTextColor={colors.placeholder}
              editable={!saving}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Deadline (YYYY-MM-DD) *</Text>
            <TextInput
              style={[styles.input, errors.deadline && styles.inputError]}
              value={deadline}
              onChangeText={text => {
                setDeadline(text);
                if (errors.deadline) {
                  setErrors(prev => ({ ...prev, deadline: '' }));
                }
              }}
              placeholder="2024-12-31"
              placeholderTextColor={colors.placeholder}
              editable={!saving}
            />
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
              <Text style={[styles.resetButtonText, !hasChanges() && styles.buttonTextDisabled]}>
                Reset
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!hasChanges() || saving) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={!hasChanges() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.saveButtonText, !hasChanges() && styles.buttonTextDisabled]}>
                  Save Goal
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Toast {...toast} onHide={hideToast} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs / 2,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
