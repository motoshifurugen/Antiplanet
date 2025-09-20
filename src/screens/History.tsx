import React, { useState, useEffect, useRef } from 'react';
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
import { Toast, ToastType } from '../components/UI/Toast';
import { Icon } from '../components/UI/Icon';
import { useAppStore } from '../stores';
import { Civilization, ProgressMemo } from '../types';
import { formatDate, formatRelativeTime } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';
import { ui } from '../theme/ui';

type HistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'History'
>;

interface HistoryScreenProps {
  navigation: HistoryScreenNavigationProp;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface HistoryItem {
  id: string;
  type: 'memo' | 'header';
  date: string;
  memo?: ProgressMemo;
  civilization?: Civilization;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  navigation: _navigation,
}) => {
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const [selectedCivilizationId, setSelectedCivilizationId] = useState<string | undefined>();
  
  const {
    civilizations,
    loading,
    loadCivilizations,
    getProgressMemos,
    deriveCivStates,
  } = useAppStore();

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  // Load history data
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const allMemos: ProgressMemo[] = [];
      
      // Get all progress memos for all civilizations
      for (const civ of civilizations) {
        const memos = await getProgressMemos(civ.id);
        allMemos.push(...memos);
      }
      
      // Sort by date (newest first)
      allMemos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Group by date and create history items
      const groupedByDate = allMemos.reduce((acc, memo) => {
        const date = memo.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(memo);
        return acc;
      }, {} as Record<string, ProgressMemo[]>);
      
      const items: HistoryItem[] = [];
      
      // Create history items with headers
      Object.entries(groupedByDate).forEach(([date, memos]) => {
        // Add date header
        items.push({
          id: `header-${date}`,
          type: 'header',
          date,
        });
        
        // Add memo items
        memos.forEach(memo => {
          const civilization = civilizations.find(civ => civ.id === memo.civId);
          items.push({
            id: memo.id,
            type: 'memo',
            date,
            memo,
            civilization,
          });
        });
      });
      
      setHistoryItems(items);
    } catch (error) {
      console.error('Failed to load history:', error);
      showToast('履歴の読み込みに失敗しました', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (civilizations.length > 0) {
        loadHistory();
      }
    }, [civilizations])
  );

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
      await loadHistory();
      showToast('更新しました', 'success');
    } catch (error) {
      showToast('更新に失敗しました', 'error');
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>
            {formatDate(item.date)}
          </Text>
        </View>
      );
    }

    if (!item.memo || !item.civilization) return null;

    const { memo, civilization } = item;
    const isSelected = civilization.id === selectedCivilizationId;

    return (
      <View style={[
        styles.memoCard,
        isSelected && styles.selectedMemoCard
      ]}>
        <View style={styles.memoHeader}>
          <View style={styles.memoHeaderLeft}>
            <Text style={styles.civilizationName}>{civilization.name}</Text>
            {isSelected && (
              <View style={styles.selectedIndicator}>
                <Icon name="success" size="xs" color="#FFFFFF" />
              </View>
            )}
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelText}>
              Lv.{memo.levelBefore} → Lv.{memo.levelAfter}
            </Text>
            <Text style={[
              styles.levelChangeText,
              memo.levelChange >= 0 ? styles.levelIncrease : styles.levelDecrease
            ]}>
              {memo.levelChange >= 0 ? '+' : ''}{memo.levelChange}
            </Text>
          </View>
        </View>

        <Text style={styles.memoText}>{memo.memo}</Text>
        
        <Text style={styles.memoTime}>
          {formatRelativeTime(memo.createdAt)}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIconContainer}>
        <Icon name="civilizations" size="xl" color={colors.primary} />
      </View>
      <Text style={styles.emptyStateTitle}>履歴がありません</Text>
      <Text style={styles.emptyStateSubtitle}>
        進捗メモを記録すると、ここに履歴が表示されます。
      </Text>
    </View>
  );

  if (loading && civilizations.length === 0) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
        <Toast {...toast} onHide={hideToast} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>進捗履歴</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Icon name="refresh" size="sm" color={colors.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={historyItems}
          renderItem={renderHistoryItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            historyItems.length === 0 && styles.emptyListContainer,
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={historyLoading} 
              onRefresh={handleRefresh} 
            />
          }
          ListEmptyComponent={renderEmptyState}
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
  header: {
    ...ui.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  refreshButton: {
    padding: spacing.sm,
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  dateHeader: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dateHeaderText: {
    ...typography.subheading,
    color: colors.primary,
    fontWeight: '600',
  },
  memoCard: {
    ...ui.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  selectedMemoCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  memoHeaderLeft: {
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
  selectedIndicator: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.xs,
  },
  levelInfo: {
    alignItems: 'flex-end',
  },
  levelText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  levelChangeText: {
    ...typography.small,
    fontWeight: '600',
    marginTop: spacing.xs / 2,
  },
  levelIncrease: {
    color: colors.success,
  },
  levelDecrease: {
    color: colors.error,
  },
  memoText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  memoTime: {
    ...typography.small,
    color: colors.textTertiary,
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
