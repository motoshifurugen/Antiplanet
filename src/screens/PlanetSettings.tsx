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
import { Icon } from '../components/UI/Icon';
import { useAppStore } from '../stores';
import { formatRemainingDays } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';
import { ui } from '../theme/ui';

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
      newErrors.title = '目標タイトルは必須です';
    }

    if (!deadline.trim()) {
      newErrors.deadline = '期限は必須です';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      newErrors.deadline = 'YYYY-MM-DD形式で入力してください';
    } else {
      const date = new Date(deadline);
      if (isNaN(date.getTime())) {
        newErrors.deadline = '無効な日付です';
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
      showToast('惑星目標が正常に保存されました', 'success');
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

  if (loading && !planetGoal) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>惑星目標を読み込み中...</Text>
        </View>
        <Toast {...toast} onHide={hideToast} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>惑星設定</Text>
        <Text style={styles.subtitle}>惑星の目標とタイムラインを設定</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>目標タイトル *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={goalTitle}
              onChangeText={text => {
                setGoalTitle(text);
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: '' }));
                }
              }}
              placeholder="惑星の主要な目標を入力"
              placeholderTextColor={colors.placeholder}
              editable={!saving}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>期限 (YYYY-MM-DD) *</Text>
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
              <Icon name="edit" size="sm" color={colors.text} style={styles.buttonIcon} />
              <Text style={[styles.resetButtonText, !hasChanges() && styles.buttonTextDisabled]}>
                リセット
              </Text>
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
                    目標を保存
                  </Text>
                </>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.text,
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
});
