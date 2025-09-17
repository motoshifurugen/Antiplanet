// Bottom sheet for civilization info and actions

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  FlatList,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Civilization, ProgressLog } from '../types';
import { StateBadge } from './UI/StateBadge';
import { Icon } from './UI/Icon';
import { formatRelativeTime, formatDate, calculateRemainingDays, formatRemainingDays } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CivilizationBottomSheetProps {
  visible: boolean;
  civilization: Civilization | null;
  onClose: () => void;
  onRecordProgress: (civilization: Civilization, note?: string) => Promise<void>;
  loading?: boolean;
}

export const CivilizationBottomSheet: React.FC<CivilizationBottomSheetProps> = ({
  visible,
  civilization,
  onClose,
  onRecordProgress,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressNote, setProgressNote] = useState('');
  const [progressLogs, setProgressLogs] = useState<ProgressLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showFixedCloseButton, setShowFixedCloseButton] = useState(true); // Always show
  const [scrollOffset, setScrollOffset] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  
  const translateY = new Animated.Value(0);

  // Load progress logs when civilization changes
  useEffect(() => {
    if (civilization) {
      loadProgressLogs();
    }
  }, [civilization]);

  // Update remaining days when civilization changes
  useEffect(() => {
    if (civilization) {
      const days = calculateRemainingDays(civilization.deadline);
      setRemainingDays(days);
    }
  }, [civilization]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isScrollingUp = contentOffset.y > 0;
    
    setScrollOffset(contentOffset.y);
    
    // Check if we can scroll up (not at the top)
    const canScroll = contentOffset.y > 0;
    setCanScrollUp(canScroll);
    
    console.log('Scroll event:', { 
      contentOffset: contentOffset.y, 
      canScrollUp: canScroll,
      isScrollingUp,
      contentSize: contentSize.height,
      layoutMeasurement: layoutMeasurement.height
    });
    
    if (isScrollingUp && !isExpanded) {
      setIsExpanded(true);
    }
    
    setIsScrolling(isScrollingUp);
  };

  const handleScrollBeginDrag = () => {
    setIsScrolling(true);
  };

  const handleScrollEndDrag = () => {
    setIsScrolling(false);
  };

  const handlePanGestureEvent = (event: any) => {
    const { translationY } = event.nativeEvent;
    
    console.log('Pan gesture event:', { translationY, canScrollUp, scrollOffset });
    
    // Only allow downward swipe when at the top of scroll
    if (!canScrollUp && translationY > 0) {
      translateY.setValue(translationY);
    }
  };

  const handlePanStateChange = (event: any) => {
    const { state, translationY, velocityY } = event.nativeEvent;
    
    console.log('Pan gesture state change:', { 
      state, 
      translationY, 
      velocityY, 
      canScrollUp, 
      scrollOffset 
    });
    
    if (state === State.END) {
      // Only close if we're at the top of scroll and swiped down
      if (!canScrollUp && (translationY > 2 || velocityY > 10)) {
        console.log('Closing sheet with swipe');
        Animated.timing(translateY, {
          toValue: 1000,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
      } else {
        console.log('Snapping back to original position');
        // Snap back to original position
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const loadProgressLogs = async () => {
    if (!civilization) return;
    
    setLogsLoading(true);
    try {
      const existingLogs = await AsyncStorage.getItem('progress_logs');
      const allLogs = existingLogs ? JSON.parse(existingLogs) : [];
      const civLogs = allLogs
        .filter((log: any) => log.civId === civilization.id)
        .sort((a: any, b: any) => b.createdAt - a.createdAt);
      setProgressLogs(civLogs);
    } catch (error) {
      console.error('Failed to load progress logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRecordProgress = async () => {
    if (!civilization) return;
    
    try {
      await onRecordProgress(civilization, progressNote.trim() || undefined);
      setProgressNote('');
      setShowProgressForm(false);
      // Reload logs to show the new entry
      await loadProgressLogs();
    } catch (error) {
      console.error('Failed to record progress:', error);
    }
  };

  const getRemainingDaysStyle = () => {
    if (remainingDays === null) return styles.remainingDaysNeutral;
    if (remainingDays <= 0) return styles.remainingDaysOverdue;
    if (remainingDays <= 7) return styles.remainingDaysUrgent;
    return styles.remainingDaysNormal;
  };

  const getRemainingDaysText = () => {
    if (remainingDays === null) return '期限不明';
    if (remainingDays === 0) return '今日が期限';
    if (remainingDays > 0) return `残り${remainingDays}日`;
    return `${Math.abs(remainingDays)}日超過`;
  };

  const renderProgressLogItem = ({ item }: { item: ProgressLog }) => (
    <View style={styles.logItem}>
      <Text style={styles.logDate}>
        {new Date(item.createdAt).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })}
      </Text>
      {item.note && (
        <Text style={styles.logNote} numberOfLines={3}>
          {item.note}
        </Text>
      )}
    </View>
  );

  if (!civilization) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        <PanGestureHandler
          onGestureEvent={handlePanGestureEvent}
          onHandlerStateChange={handlePanStateChange}
          activeOffsetY={0.5}
          failOffsetX={[-5, 5]}
          shouldCancelWhenOutside={false}
          simultaneousHandlers={[]}
        >
          <Animated.View 
            style={[
              styles.container, 
              isExpanded && styles.containerExpanded,
              { transform: [{ translateY }] }
            ]}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              onScroll={handleScroll}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              scrollEventThrottle={16}
              scrollEnabled={true}
              nestedScrollEnabled={false}
            >
            {/* Handle bar */}
            <TouchableOpacity 
              style={styles.handleBar} 
              onPress={() => setIsExpanded(!isExpanded)}
            />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{civilization.name}</Text>
                <StateBadge state={civilization.state} />
              </View>
              <View style={styles.headerRight}>
                <Text style={[styles.remainingDays, getRemainingDaysStyle()]}>
                  {getRemainingDaysText()}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Icon name="delete" size="sm" color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Detailed Info */}
            <View style={styles.infoSection}>
              {/* Basic Info */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoGroupTitle}>基本情報</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>期限:</Text>
                  <Text style={styles.infoValue}>{formatDate(civilization.deadline)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>最終進捗:</Text>
                  <Text style={styles.infoValue}>
                    {formatRelativeTime(civilization.lastProgressAt)}
                  </Text>
                </View>

                {civilization.purpose && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>目的:</Text>
                    <Text style={styles.infoValue}>{civilization.purpose}</Text>
                  </View>
                )}
              </View>

              {/* Level Information */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoGroupTitle}>文明レベル</Text>
                <View style={styles.levelContainer}>
                  <View style={styles.levelItem}>
                    <Text style={styles.levelLabel}>文化レベル</Text>
                    <View style={styles.levelBar}>
                      <View 
                        style={[
                          styles.levelBarFill, 
                          { width: `${civilization.levels.culturalLevel}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.levelValue}>{civilization.levels.culturalLevel}%</Text>
                  </View>

                  <View style={styles.levelItem}>
                    <Text style={styles.levelLabel}>成長レベル</Text>
                    <View style={styles.levelBar}>
                      <View 
                        style={[
                          styles.levelBarFill, 
                          { width: `${civilization.levels.growthLevel}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.levelValue}>{civilization.levels.growthLevel}%</Text>
                  </View>

                  <View style={styles.levelItem}>
                    <Text style={styles.levelLabel}>総合レベル</Text>
                    <View style={styles.levelBar}>
                      <View 
                        style={[
                          styles.levelBarFill, 
                          { width: `${civilization.levels.totalLevel}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.levelValue}>{civilization.levels.totalLevel}%</Text>
                  </View>

                  <View style={styles.classificationContainer}>
                    <Text style={styles.classificationLabel}>分類:</Text>
                    <View style={styles.classificationBadge}>
                      <Text style={styles.classificationText}>
                        {civilization.levels.classification === 'grassland' && '草原'}
                        {civilization.levels.classification === 'village' && '村'}
                        {civilization.levels.classification === 'town' && '町'}
                        {civilization.levels.classification === 'city' && '都市'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Statistics */}
              <View style={styles.infoGroup}>
                <Text style={styles.infoGroupTitle}>統計情報</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>進捗記録数</Text>
                    <Text style={styles.statValue}>{progressLogs.length}回</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>作成日</Text>
                    <Text style={styles.statValue}>
                      {new Date(civilization.createdAt).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>更新日</Text>
                    <Text style={styles.statValue}>
                      {new Date(civilization.updatedAt).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Progress Logging Form */}
            {showProgressForm && (
              <View style={styles.progressFormSection}>
                <Text style={styles.formLabel}>進捗メモ（任意）</Text>
                <TextInput
                  style={styles.noteInput}
                  value={progressNote}
                  onChangeText={setProgressNote}
                  placeholder="進捗の詳細を記録..."
                  multiline
                  maxLength={300}
                  placeholderTextColor={colors.textSecondary}
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowProgressForm(false);
                      setProgressNote('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleRecordProgress}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>保存</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.progressButton, loading && styles.buttonDisabled]}
                onPress={() => setShowProgressForm(true)}
                disabled={loading}
              >
                <Icon name="progress" size="sm" color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.progressButtonText}>進捗を記録</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.editButton} onPress={onClose}>
                <Icon name="edit" size="sm" color={colors.text} style={styles.buttonIcon} />
                <Text style={styles.editButtonText}>編集</Text>
              </TouchableOpacity>
            </View>

            {/* History Section - Only show when expanded */}
            {isExpanded && (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>進捗履歴</Text>
                {logsLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>読み込み中...</Text>
                  </View>
                ) : progressLogs.length > 0 ? (
                  <FlatList
                    data={progressLogs}
                    renderItem={renderProgressLogItem}
                    keyExtractor={(item) => item.id}
                    style={styles.logsList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <Text style={styles.emptyLogsText}>まだ進捗が記録されていません</Text>
                )}
              </View>
            )}
            </ScrollView>
          </Animated.View>
        </PanGestureHandler>
        
        {/* Fixed Close Button - Always show */}
        {showFixedCloseButton && (
          <View style={styles.fixedCloseButtonContainer}>
            <TouchableOpacity 
              style={styles.fixedCloseButton}
              onPress={onClose}
            >
              <Icon name="delete" size="md" color="#FFFFFF" />
              <Text style={styles.fixedCloseButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    maxHeight: '50%',
    backgroundColor: colors.modalBackground,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerExpanded: {
    maxHeight: '95%',
    minHeight: '80%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
  },
  remainingDays: {
    ...typography.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  remainingDaysNormal: {
    color: colors.text,
    backgroundColor: colors.background,
  },
  remainingDaysUrgent: {
    color: '#D97706', // amber-600
    backgroundColor: '#FEF3C7', // amber-100
  },
  remainingDaysOverdue: {
    color: '#DC2626', // red-600
    backgroundColor: '#FEE2E2', // red-100
  },
  remainingDaysNeutral: {
    color: colors.textSecondary,
    backgroundColor: colors.background,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoGroup: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  infoGroupTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 100,
  },
  infoValue: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  levelContainer: {
    gap: spacing.md,
  },
  levelItem: {
    marginBottom: spacing.sm,
  },
  levelLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  levelBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  levelValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  classificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  classificationLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  classificationBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  classificationText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  statValue: {
    ...typography.subheading,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressFormSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  formLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  noteInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.modalBackground,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  actionSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressButton: {
    ...ui.button.primary,
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  editButton: {
    ...ui.button.warning,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  fixedCloseButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fixedCloseButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fixedCloseButtonText: {
    ...typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  historySection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  historyTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logsList: {
    maxHeight: 200,
  },
  logItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logDate: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  logNote: {
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
  emptyLogsText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
