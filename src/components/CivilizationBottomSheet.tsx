// Simplified bottom sheet for civilization info and progress recording

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Civilization, ProgressMemo, CreateProgressMemoRequest, UpdateProgressMemoRequest } from '../types';
import { Icon } from './UI/Icon';
import { formatDate } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressMemoModal } from './ProgressMemoModal';
import { createProgressMemo, updateProgressMemo } from '../repositories/progressMemoRepository';

interface CivilizationBottomSheetProps {
  visible: boolean;
  civilization: Civilization | null;
  onClose: () => void;
  onRecordProgress: (civilization: Civilization) => Promise<void>;
  loading?: boolean;
}

export const CivilizationBottomSheet: React.FC<CivilizationBottomSheetProps> = ({
  visible,
  civilization,
  onClose,
  onRecordProgress,
  loading = false,
}) => {
  const [latestMemo, setLatestMemo] = useState<ProgressMemo | null>(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const [progressMemoModalVisible, setProgressMemoModalVisible] = useState(false);
  const [editingMemo, setEditingMemo] = useState<ProgressMemo | undefined>();
  const [memoModalLoading, setMemoModalLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const screenHeight = Dimensions.get('window').height;
  const translateY = new Animated.Value(screenHeight);
  const fadeAnim = new Animated.Value(0);

  // Load latest progress memo when civilization changes
  useEffect(() => {
    if (civilization) {
      loadLatestMemo();
    }
  }, [civilization]);

  // Animation control functions
  const animateIn = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    fadeAnim.setValue(1);
    translateY.setValue(0);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 100);
  };

  const animateOut = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    fadeAnim.setValue(0);
    translateY.setValue(screenHeight);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 100);
  };

  // Simple animation - just show/hide
  useEffect(() => {
    if (visible) {
      animateIn();
    } else {
      animateOut();
    }
  }, [visible]);

  const loadLatestMemo = async () => {
    if (!civilization) return;
    
    setMemoLoading(true);
    try {
      // Load progress memos from AsyncStorage
      const memosData = await AsyncStorage.getItem('progress_memos');
      if (memosData) {
        const allMemos: ProgressMemo[] = JSON.parse(memosData);
        const civMemos = allMemos
          .filter(memo => memo.civId === civilization.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setLatestMemo(civMemos.length > 0 ? civMemos[0] : null);
      }
    } catch (error) {
      console.error('Failed to load latest memo:', error);
    } finally {
      setMemoLoading(false);
    }
  };

  const handleRecordProgress = async () => {
    if (!civilization) return;
    
    try {
      // Check if today's memo already exists
      const today = new Date().toISOString().split('T')[0];
      const memosData = await AsyncStorage.getItem('progress_memos');
      
      if (memosData) {
        const allMemos: ProgressMemo[] = JSON.parse(memosData);
        const todayMemo = allMemos.find(memo => 
          memo.civId === civilization.id && memo.date === today
        );
        
        if (todayMemo) {
          // Edit existing memo
          setEditingMemo(todayMemo);
        } else {
          // Create new memo
          setEditingMemo(undefined);
        }
      } else {
        // Create new memo
        setEditingMemo(undefined);
      }
      
      setProgressMemoModalVisible(true);
    } catch (error) {
      console.error('Failed to check today\'s memo:', error);
    }
  };

  const handleSubmitProgressMemo = async (
    data: CreateProgressMemoRequest | UpdateProgressMemoRequest
  ) => {
    if (!civilization) return;
    
    setMemoModalLoading(true);
    try {
      if (editingMemo) {
        // Update existing memo
        await updateProgressMemo(civilization.id, data as UpdateProgressMemoRequest);
      } else {
        // Create new memo
        await createProgressMemo(civilization.id, data as CreateProgressMemoRequest);
      }
      
      // Update civilization's lastProgressAt timestamp
      await onRecordProgress(civilization);
      
      // Reload latest memo after recording
      await loadLatestMemo();
      
      setProgressMemoModalVisible(false);
    } catch (error) {
      console.error('Failed to submit progress memo:', error);
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setMemoModalLoading(false);
    }
  };

  const handlePanGesture = (event: any) => {
    if (isAnimating) return; // Prevent gesture during animation
    
    const { translationY, state } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      translateY.setValue(Math.max(0, translationY));
    } else if (state === State.END) {
      if (translationY > screenHeight * 0.15) {
        // Close immediately
        animateOut();
        onClose();
      } else {
        // Return to original position
        translateY.setValue(0);
      }
    }
  };

  if (!civilization) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        
        <PanGestureHandler onHandlerStateChange={handlePanGesture}>
          <Animated.View
            style={[
              styles.container,
              { transform: [{ translateY }] }
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />
            
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.civilizationName}>{civilization.name}</Text>
            </View>

            {/* Level Display */}
            <View style={styles.levelSection}>
              <Text style={styles.levelLabel}>現在のレベル</Text>
              <View style={styles.levelContainer}>
                <Text style={styles.levelValue}>
                  Lv.{civilization.levels?.totalLevel || 0}
                </Text>
                <Text style={styles.levelClassification}>
                  {civilization.levels?.classification || 'grassland'}
                </Text>
              </View>
            </View>

            {/* Latest History */}
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>最新の記録</Text>
              {memoLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>読み込み中...</Text>
                </View>
              ) : latestMemo ? (
                <View style={styles.latestMemoCard}>
                  <View style={styles.memoHeader}>
                    <Text style={styles.memoDate}>
                      {formatDate(latestMemo.date)}
                    </Text>
                  </View>
                  <Text style={styles.memoText}>{latestMemo.memo}</Text>
                </View>
              ) : (
                <View style={styles.emptyMemoCard}>
                  <Icon name="civilizations" size="md" color={colors.textTertiary} />
                  <Text style={styles.emptyMemoText}>まだ記録がありません</Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={handleRecordProgress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="add" size="sm" color="#FFFFFF" />
                    <Text style={styles.recordButtonText}>進捗を記録</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </PanGestureHandler>
        
        <ProgressMemoModal
          visible={progressMemoModalVisible}
          onClose={() => setProgressMemoModalVisible(false)}
          onSubmit={handleSubmitProgressMemo}
          memo={editingMemo}
          loading={memoModalLoading}
          isEditMode={!!editingMemo}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    paddingBottom: spacing.xl,
    height: '70%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  civilizationName: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  levelSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  levelLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelValue: {
    ...typography.heading,
    color: colors.primary,
    fontWeight: '700',
  },
  levelClassification: {
    ...typography.body,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  historyTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  latestMemoCard: {
    ...ui.card,
    padding: spacing.md,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  memoDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  memoText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  emptyMemoCard: {
    ...ui.card,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMemoText: {
    ...typography.body,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actionSection: {
    paddingHorizontal: spacing.lg,
  },
  recordButton: {
    ...ui.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  recordButtonText: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});