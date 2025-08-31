// Modal for adding/editing civilizations

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Civilization, CreateCivilizationRequest, UpdateCivilizationRequest } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

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

  // Reset form when modal opens/closes or civilization changes
  useEffect(() => {
    if (visible) {
      setName(civilization?.name || '');
      setDeadline(civilization?.deadline || '');
      setPurpose(civilization?.purpose || '');
      setErrors({});
    }
  }, [visible, civilization]);

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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {civilization ? '文明を編集' : '文明を追加'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
          >
            <Text style={styles.submitButtonText}>
              {loading ? '保存中...' : civilization ? '更新' : '作成'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  form: {
    flex: 1,
    padding: spacing.md,
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
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
