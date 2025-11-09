import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Screen } from '../components/UI/Screen';
import { StateBadge } from '../components/UI/StateBadge';
import { Toast, ToastType } from '../components/UI/Toast';
import { Icon } from '../components/UI/Icon';
import { CivilizationModal } from '../components/CivilizationModal';
import { ProgressMemoModal } from '../components/ProgressMemoModal';
import { useAppStore } from '../stores';
import { Civilization, CreateCivilizationRequest, UpdateCivilizationRequest, ProgressMemo, CreateProgressMemoRequest, UpdateProgressMemoRequest } from '../types';
import { formatRelativeTime, formatDate } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';
import { ui } from '../theme/ui';
import { strings } from '../i18n/strings';

type CivilizationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Civilizations'
>;

interface CivilizationsScreenProps {
  navigation: CivilizationsScreenNavigationProp;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const CivilizationsScreen: React.FC<CivilizationsScreenProps> = ({
  navigation,
}) => {
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const [selectedCivilizationId, setSelectedCivilizationId] = useState<string | undefined>();
  
  const {
    civilizations,
    loading,
    loadCivilizations,
    createCiv,
    updateCiv,
    deleteCiv,
    logProgress,
    createProgressMemo,
    updateProgressMemo,
    getTodayProgressMemo,
    hasTodayProgressMemo,
    deriveCivStates,
  } = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCivilization, setEditingCivilization] = useState<Civilization | undefined>();
  const [modalLoading, setModalLoading] = useState(false);
  
  // Progress memo modal state
  const [progressMemoModalVisible, setProgressMemoModalVisible] = useState(false);
  const [selectedCivilizationForMemo, setSelectedCivilizationForMemo] = useState<Civilization | undefined>();
  const [editingProgressMemo, setEditingProgressMemo] = useState<ProgressMemo | undefined>();
  const [progressMemoModalLoading, setProgressMemoModalLoading] = useState(false);
  
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Get selected civilization ID from route params
  useEffect(() => {
    const params = route.params as { selectedCivilizationId?: string } | undefined;
    if (params?.selectedCivilizationId) {
      setSelectedCivilizationId(params.selectedCivilizationId);
    }
  }, [route.params]);

  // Scroll to selected civilization when it's available
  useEffect(() => {
    if (selectedCivilizationId && civilizations.length > 0 && flatListRef.current) {
      const index = civilizations.findIndex(civ => civ.id === selectedCivilizationId);
      if (index >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true });
        }, 500); // Delay to ensure the list is rendered
      }
    }
  }, [selectedCivilizationId, civilizations]);

  // Derive states when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      deriveCivStates();
    }, [deriveCivStates])
  );

  // Set header right button with add icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerAddButton}
          onPress={handleAddCivilization}
        >
          <Icon name="add" size="sm" color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleAddCivilization]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const handleRefresh = async () => {
    try {
      await loadCivilizations();
      deriveCivStates();
      showToast('Refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh', 'error');
    }
  };

  const handleAddCivilization = useCallback(() => {
    setEditingCivilization(undefined);
    setModalVisible(true);
  }, []);

  const handleEditCivilization = (civilization: Civilization) => {
    setEditingCivilization(civilization);
    setModalVisible(true);
  };

  const handleSubmitCivilization = async (
    data: CreateCivilizationRequest | UpdateCivilizationRequest
  ) => {
    setModalLoading(true);
    try {
      if (editingCivilization) {
        await updateCiv(editingCivilization.id, data);
        showToast(strings.messages.civilizationUpdated, 'success');
      } else {
        await createCiv(data as CreateCivilizationRequest);
        showToast(strings.messages.civilizationCreated, 'success');
      }
      deriveCivStates();
    } catch (error) {
      console.error('Failed to submit civilization:', error);
      showToast(
        editingCivilization
          ? '変更を保存できませんでした。接続を確認して再試行してください。'
          : 'Civilizationを作成できませんでした。接続を確認して再試行してください。',
        'error'
      );
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCivilization = (civilization: Civilization) => {
    Alert.alert(
      strings.deleteConfirm.title,
      `"${civilization.name}"を削除してもよろしいですか？${strings.deleteConfirm.message}`,
      [
        { text: strings.actions.cancel, style: 'cancel' },
        {
          text: strings.deleteConfirm.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCiv(civilization.id);
              showToast(strings.messages.civilizationDeleted, 'success');
            } catch (error) {
              console.error('Failed to delete civilization:', error);
              showToast('Civilizationを削除できませんでした。接続を確認して再試行してください。', 'error');
            }
          },
        },
      ]
    );
  };

  const handleLogProgress = async (civilization: Civilization) => {
    try {
      await logProgress(civilization.id);
      showToast(strings.messages.progressLogged, 'success');
    } catch (error) {
      showToast(strings.messages.progressFailed, 'error');
    }
  };

  const handleProgressMemo = async (civilization: Civilization) => {
    try {
      // Check if today's memo already exists
      const hasTodayMemo = await hasTodayProgressMemo(civilization.id);
      
      if (hasTodayMemo) {
        // Edit existing memo
        const todayMemo = await getTodayProgressMemo(civilization.id);
        setEditingProgressMemo(todayMemo || undefined);
      } else {
        // Create new memo
        setEditingProgressMemo(undefined);
      }
      
      setSelectedCivilizationForMemo(civilization);
      setProgressMemoModalVisible(true);
    } catch (error) {
      console.error('Failed to handle progress memo:', error);
      showToast('進捗メモの取得に失敗しました', 'error');
    }
  };

  const handleSubmitProgressMemo = async (
    data: CreateProgressMemoRequest | UpdateProgressMemoRequest
  ) => {
    if (!selectedCivilizationForMemo) return;
    
    setProgressMemoModalLoading(true);
    try {
      if (editingProgressMemo) {
        // Update existing memo
        await updateProgressMemo(selectedCivilizationForMemo.id, data as UpdateProgressMemoRequest);
        showToast('進捗メモを更新しました', 'success');
      } else {
        // Create new memo
        await createProgressMemo(selectedCivilizationForMemo.id, data as CreateProgressMemoRequest);
        showToast('進捗メモを記録しました', 'success');
      }
      
      // Update civilization's lastProgressAt timestamp
      await logProgress(selectedCivilizationForMemo.id);
      deriveCivStates();
    } catch (error) {
      console.error('Failed to submit progress memo:', error);
      showToast('進捗メモの保存に失敗しました', 'error');
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setProgressMemoModalLoading(false);
    }
  };

  // Check if civilization has no progress today
  const hasNoProgressToday = (civilization: Civilization): boolean => {
    if (!civilization.lastProgressAt) {
      return true; // No progress recorded at all
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    return civilization.lastProgressAt < todayStart; // Progress was before today
  };

  const renderCivilization = ({ item }: { item: Civilization }) => {
    const isSelected = item.id === selectedCivilizationId;
    const noProgressToday = hasNoProgressToday(item);
    
    return (
      <View style={[styles.civilizationCard, isSelected && styles.selectedCivilizationCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.civilizationName}>{item.name}</Text>
            <StateBadge state={item.state} />
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Icon name="success" size="xs" color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.civilizationDetail}>{strings.civilization.fields.deadline}: {formatDate(item.deadline)}</Text>
        <Text style={styles.civilizationDetail}>
          {strings.civilization.fields.lastProgress}: {formatRelativeTime(item.lastProgressAt)}
        </Text>
        {item.purpose && <Text style={styles.civilizationPurpose}>{item.purpose}</Text>}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.progressButton} onPress={() => handleProgressMemo(item)}>
            <Text style={styles.progressButtonText}>進捗メモ</Text>
            {noProgressToday && <View style={styles.progressBadgeDot} />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIconContainer}>
        <Icon name="civilizations" size="xl" color={colors.primary} />
      </View>
      <Text style={styles.emptyStateTitle}>{strings.civilization.emptyState.title}</Text>
      <Text style={styles.emptyStateSubtitle}>
        {strings.civilization.emptyState.subtitle}
      </Text>
    </View>
  );

  if (loading && civilizations.length === 0) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{strings.messages.loading.civilizations}</Text>
        </View>
        <Toast {...toast} onHide={hideToast} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={civilizations}
          renderItem={renderCivilization}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            civilizations.length === 0 && styles.emptyListContainer,
          ]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
          ListEmptyComponent={renderEmptyState}
          onScrollToIndexFailed={(info) => {
            // Handle scroll to index failure gracefully
            console.warn('Failed to scroll to index:', info);
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
            }, 100);
          }}
        />

        <CivilizationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmitCivilization}
          civilization={editingCivilization}
          loading={modalLoading}
        />

        <ProgressMemoModal
          visible={progressMemoModalVisible}
          onClose={() => setProgressMemoModalVisible(false)}
          onSubmit={handleSubmitProgressMemo}
          memo={editingProgressMemo}
          loading={progressMemoModalLoading}
          isEditMode={!!editingProgressMemo}
        />

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
  headerAddButton: {
    ...ui.button.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 0,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  civilizationCard: {
    ...ui.card,
    marginBottom: spacing.md,
  },
  selectedCivilizationCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10', // 10% opacity
  },
  selectedIndicator: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  civilizationName: {
    ...typography.subheading,
    color: colors.text,
    flex: 1,
  },
  civilizationDetail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  civilizationPurpose: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actionButtons: {
    marginTop: spacing.md,
  },
  progressButton: {
    ...ui.button.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  progressButtonText: {
    ...typography.subheading,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  progressBadgeDot: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: colors.error,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateIconContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    ...typography.subheading,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
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
});
