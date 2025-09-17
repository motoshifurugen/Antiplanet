import React, { useState, useRef, useEffect } from 'react';
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
import { useAppStore } from '../stores';
import { Civilization, CreateCivilizationRequest, UpdateCivilizationRequest } from '../types';
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
  navigation: _navigation,
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
          : '挑戦を作成できませんでした。接続を確認して再試行してください。',
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
              showToast('挑戦を削除できませんでした。接続を確認して再試行してください。', 'error');
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

  const renderCivilization = ({ item }: { item: Civilization }) => {
    const isSelected = item.id === selectedCivilizationId;
    
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
          <TouchableOpacity style={styles.progressButton} onPress={() => handleLogProgress(item)}>
            <Text style={styles.progressButtonText}>{strings.actions.recordProgress}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editButton} onPress={() => handleEditCivilization(item)}>
            <Text style={styles.editButtonText}>{strings.actions.edit}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCivilization(item)}
          >
            <Text style={styles.deleteButtonText}>{strings.actions.delete}</Text>
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
        <View style={styles.header}>
          <Text style={styles.title}>{strings.screens.civilizations.title}</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCivilization}>
            <Icon name="add" size="sm" color="#FFFFFF" style={styles.addButtonIcon} />
            <Text style={styles.addButtonText}>{strings.screens.civilizations.addButton}</Text>
          </TouchableOpacity>
        </View>

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
  addButton: {
    ...ui.button.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  addButtonIcon: {
    marginRight: spacing.xs,
  },
  addButtonText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
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
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressButton: {
    ...ui.button.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flex: 1,
  },
  progressButtonText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  editButton: {
    ...ui.button.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flex: 1,
  },
  editButtonText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    ...ui.button.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flex: 1,
  },
  deleteButtonText: {
    ...typography.small,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
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
