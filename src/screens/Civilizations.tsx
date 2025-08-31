import React, { useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/UI/Screen';
import { StateBadge } from '../components/UI/StateBadge';
import { Toast, ToastType } from '../components/UI/Toast';
import { CivilizationModal } from '../components/CivilizationModal';
import { useAppStore } from '../stores';
import { Civilization, CreateCivilizationRequest, UpdateCivilizationRequest } from '../types';
import { formatRelativeTime, formatDate } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { RootStackParamList } from '../navigation/navigation/RootNavigator';

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
  navigation: _navigation,
}) => {
  const {
    civilizations,
    loading,
    loadCivilizations,
    createCiv,
    updateCiv,
    deleteCiv,
    logProgress,
    deriveCivStates,
  } = useAppStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCivilization, setEditingCivilization] = useState<Civilization | undefined>();
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Derive states when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      deriveCivStates();
    }, [deriveCivStates])
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
      showToast('Refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh', 'error');
    }
  };

  const handleAddCivilization = () => {
    setEditingCivilization(undefined);
    setModalVisible(true);
  };

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
        showToast('文明が正常に更新されました', 'success');
      } else {
        await createCiv(data as CreateCivilizationRequest);
        showToast('文明が正常に作成されました', 'success');
      }
      deriveCivStates();
    } catch (error) {
      console.error('Failed to submit civilization:', error);
      showToast(
        editingCivilization
          ? '変更を保存できませんでした。接続を確認して再試行してください。'
          : '文明を作成できませんでした。接続を確認して再試行してください。',
        'error'
      );
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCivilization = (civilization: Civilization) => {
    Alert.alert(
      '文明を削除',
      `"${civilization.name}"を削除してもよろしいですか？この操作は元に戻せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCiv(civilization.id);
              showToast('文明が正常に削除されました', 'success');
            } catch (error) {
              console.error('Failed to delete civilization:', error);
              showToast('文明を削除できませんでした。接続を確認して再試行してください。', 'error');
            }
          },
        },
      ]
    );
  };

  const handleLogProgress = async (civilization: Civilization) => {
    try {
      await logProgress(civilization.id);
      showToast(`Progress logged for ${civilization.name}`, 'success');
    } catch (error) {
      showToast('Unable to record progress. Please check your connection and try again.', 'error');
    }
  };

  const renderCivilization = ({ item }: { item: Civilization }) => (
    <View style={styles.civilizationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.civilizationName}>{item.name}</Text>
          <StateBadge state={item.state} />
        </View>
      </View>

      <Text style={styles.civilizationDetail}>期限: {formatDate(item.deadline)}</Text>
      <Text style={styles.civilizationDetail}>
        最終進捗: {formatRelativeTime(item.lastProgressAt)}
      </Text>
      {item.purpose && <Text style={styles.civilizationPurpose}>{item.purpose}</Text>}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.progressButton} onPress={() => handleLogProgress(item)}>
          <Text style={styles.progressButtonText}>進捗を記録</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editButton} onPress={() => handleEditCivilization(item)}>
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCivilization(item)}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>🌱 最初の文明を始めましょう</Text>
      <Text style={styles.emptyStateSubtitle}>
        文明を作成して、惑星上で成長、進化、繁栄する様子を観察しましょう。進捗を追跡し、時間の経過とともにどのように発展するかを見てみてください。
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddCivilization}>
        <Text style={styles.emptyStateButtonText}>文明を作成</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && civilizations.length === 0) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>文明を読み込み中...</Text>
        </View>
        <Toast {...toast} onHide={hideToast} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
                      <Text style={styles.title}>文明</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCivilization}>
            <Text style={styles.addButtonText}>文明を追加</Text>
          </TouchableOpacity>
        </View>

        <FlatList
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
        />

        <CivilizationModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSubmit={handleSubmitCivilization}
          civilization={editingCivilization}
          loading={modalLoading}
        />

        <Toast {...toast} onHide={hideToast} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: spacing.lg,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  civilizationCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  civilizationDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
  },
  civilizationPurpose: {
    fontSize: 14,
    color: colors.text,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    flex: 1,
  },
  progressButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    flex: 1,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    flex: 1,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
