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
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Reset form when modal opens/closes or civilization changes
  useEffect(() => {
    if (visible) {
      setName(civilization?.name || '');
      setDeadline(civilization?.deadline || '');
      setPurpose(civilization?.purpose || '');
      setErrors({});
      
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
      newErrors.name = '名前は必須です';
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        name: name.trim(),
        deadline,
        purpose: purpose.trim() || undefined,
        state: civilization?.state || 'uninitialized',
      } as CreateCivilizationRequest | UpdateCivilizationRequest;

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Failed to submit civilization:', error);
      // Error handling is done by parent component
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
            <View style={styles.header}>
              <Text style={styles.title}>
                {civilization ? '文明を編集' : '文明を追加'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="edit" size="sm" color={colors.primary} style={styles.closeButtonIcon} />
                <Text style={styles.closeButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>名前 *</Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={name}
                  onChangeText={setName}
                  placeholder="文明の名前を入力"
                  placeholderTextColor={colors.placeholder}
                  editable={!loading}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>期限 (YYYY-MM-DD) *</Text>
                <TextInput
                  style={[styles.input, errors.deadline && styles.inputError]}
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="2024-12-31"
                  placeholderTextColor={colors.placeholder}
                  editable={!loading}
                />
                {errors.deadline && <Text style={styles.errorText}>{errors.deadline}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>目的 (任意)</Text>
                <TextInput
                  style={styles.input}
                  value={purpose}
                  onChangeText={setPurpose}
                  placeholder="文明の目的を説明"
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>

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
          </Animated.View>
        </KeyboardAvoidingView>
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
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    ...ui.modal,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
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
  },
  inputError: {
    borderColor: colors.error,
    ...ui.inputError,
  },
  errorText: {
    color: colors.error,
    ...typography.small,
    marginTop: spacing.xs / 2,
  },
  submitButton: {
    ...ui.button.primary,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
});
