// Bottom sheet for civilization info and actions

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Civilization } from '../types';
import { StateBadge } from './UI/StateBadge';
import { formatRelativeTime, formatDate } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

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
  if (!civilization) {
    return null;
  }

  const handleRecordProgress = async () => {
    try {
      await onRecordProgress(civilization);
      onClose();
    } catch (error) {
      // Error handling is done by parent component
      console.error('Failed to record progress:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Pressable style={styles.content} onPress={e => e.stopPropagation()}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.name}>{civilization.name}</Text>
              <StateBadge state={civilization.state} />
            </View>

            {/* Info */}
            <View style={styles.infoSection}>
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

            {/* Actions */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={[styles.progressButton, loading && styles.buttonDisabled]}
                onPress={handleRecordProgress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.progressButtonText}>進捗を記録</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    maxHeight: '50%',
  },
  content: {
    padding: spacing.lg,
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  actionSection: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  progressButton: {
    flex: 2,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
});
