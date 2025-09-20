// Modal for adding/editing progress memos

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
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { ProgressMemo, CreateProgressMemoRequest, UpdateProgressMemoRequest } from '../types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';
import { Screen } from '../components/UI/Screen';
import { Icon } from '../components/UI/Icon';
import { formatDate } from '../lib/dateUtils';
import { useAppStore } from '../stores';

interface ProgressMemoModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProgressMemoRequest | UpdateProgressMemoRequest) => Promise<void>;
  memo?: ProgressMemo;
  loading?: boolean;
  isEditMode?: boolean;
}

const MAX_MEMO_LENGTH = 30;

export const ProgressMemoModal: React.FC<ProgressMemoModalProps> = ({
  visible,
  onClose,
  onSubmit,
  memo,
  loading = false,
  isEditMode = false,
}) => {
  const [memoText, setMemoText] = useState('');
  const [errors, setErrors] = useState<{ memo?: string }>({});
  const { showToast } = useAppStore(state => ({
    showToast: state.showToast,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const memoInputRef = useRef<TextInput>(null);
  
  const { height: screenHeight } = Dimensions.get('window');

  // Animation control functions
  const animateIn = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  const animateOut = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  // Initialize form data
  useEffect(() => {
    if (visible) {
      if (isEditMode && memo) {
        setMemoText(memo.memo);
      } else {
        setMemoText('');
      }
      setErrors({});
      
      // Animate in
      animateIn();
      
      // Auto focus memo input
      setTimeout(() => {
        memoInputRef.current?.focus();
      }, 400);
    } else {
      // Animate out
      animateOut();
    }
  }, [visible, isEditMode, memo]);

  // Keyboard animation control
  const animateKeyboard = (toValue: number, duration: number) => {
    if (isAnimating) return;
    
    Animated.timing(keyboardAnim, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start();
  };

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const duration = Platform.OS === 'ios' ? event.duration || 250 : 250;
        animateKeyboard(-event.endCoordinates.height, duration);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        const duration = Platform.OS === 'ios' ? event.duration || 250 : 250;
        animateKeyboard(0, duration);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [isAnimating]);


  const validateForm = (): boolean => {
    const newErrors: { memo?: string } = {};

    if (!memoText.trim()) {
      newErrors.memo = '進捗メモを入力してください';
    } else if (memoText.length > MAX_MEMO_LENGTH) {
      newErrors.memo = `メモは${MAX_MEMO_LENGTH}文字以内で入力してください`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('入力内容を確認してください', 'error');
      return;
    }

    if (isSubmitting || loading) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await onSubmit({ memo: memoText.trim() });
      } else {
        await onSubmit({ memo: memoText.trim() });
      }
      
      // Show success toast immediately
      showToast(isEditMode ? '進捗メモを更新しました' : '進捗メモを記録しました', 'success');
      
      // Close modal immediately - toast will be shown globally
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error('Failed to submit progress memo:', error);
      showToast('保存に失敗しました。再試行してください。', 'error');
      setIsSubmitting(false); // Reset state on error
    }
  };

  const handleClose = () => {
    if (isAnimating || isSubmitting) return; // Prevent closing during animation or submission
    
    if (memoText.trim() && !isEditMode) {
      Alert.alert(
        '未保存の変更',
        '入力した内容が保存されていません。閉じますか？',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '閉じる', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDate(dateString);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.modal,
                {
                  transform: [
                    { translateY: slideAnim },
                    { translateY: keyboardAnim }
                  ],
                },
              ]}
            >
                <Screen>
                  <View style={styles.header}>
                    <Text style={styles.title}>
                      {isEditMode ? '進捗メモを編集' : '進捗メモを記録'}
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleClose}
                      disabled={loading || isSubmitting}
                    >
                      <Icon name="close" size="sm" color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bodyContent}>
                    <View style={styles.dateSection}>
                      <Text style={styles.dateLabel}>日付</Text>
                      <Text style={styles.dateValue}>
                        {formatDisplayDate(getTodayDate())}
                      </Text>
                    </View>

                    <View style={styles.memoSection}>
                      <View style={styles.memoHeader}>
                        <Text style={styles.memoLabel}>進捗メモ</Text>
                        <Text style={styles.characterCount}>
                          {memoText.length}/{MAX_MEMO_LENGTH}
                        </Text>
                      </View>
                      <TextInput
                        ref={memoInputRef}
                        style={[
                          styles.memoInput,
                          errors.memo && styles.memoInputError,
                        ]}
                        value={memoText}
                        onChangeText={setMemoText}
                        placeholder="今日の進捗を記録してください（例：資料作成完了）"
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        maxLength={MAX_MEMO_LENGTH}
                        editable={!loading && !isSubmitting}
                      />
                      {errors.memo && (
                        <Text style={styles.errorText}>{errors.memo}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        (!memoText.trim() || loading || isSubmitting) && styles.submitButtonDisabled,
                      ]}
                      onPress={handleSubmit}
                      disabled={!memoText.trim() || loading || isSubmitting}
                    >
                      <Text style={[
                        styles.submitButtonText,
                        (!memoText.trim() || loading || isSubmitting) && styles.submitButtonTextDisabled,
                      ]}>
                        {isSubmitting ? '保存中...' : (isEditMode ? '更新' : '記録')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Screen>
              </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.subheading,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  bodyContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 0,
  },
  dateSection: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dateValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  memoSection: {
    paddingVertical: spacing.md,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  characterCount: {
    ...typography.small,
    color: colors.textTertiary,
  },
  memoInput: {
    ...ui.input,
    height: 75,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  memoInputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  submitButton: {
    ...ui.button.primary,
    paddingVertical: spacing.md,
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButtonTextDisabled: {
    color: colors.textTertiary,
  },
});
