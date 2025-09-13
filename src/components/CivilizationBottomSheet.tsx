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
import { Icon } from './UI/Icon';
import { formatRelativeTime, formatDate } from '../lib/dateUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { ui } from '../theme/ui';

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
                  <Icon name="clock" size="sm" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="progress" size="sm" color="#FFFFFF" style={styles.buttonIcon} />
                    <Text style={styles.progressButtonText}>進捗を記録</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="edit" size="sm" color={colors.text} style={styles.buttonIcon} />
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
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    maxHeight: '50%',
    ...ui.modal,
    backgroundColor: colors.modalBackground,
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
    ...typography.subheading,
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
  actionSection: {
    flexDirection: 'row',
    gap: spacing.md,
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
  buttonIcon: {
    marginRight: spacing.xs,
  },
  closeButton: {
    ...ui.button.ghost,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  closeButtonText: {
    ...typography.button,
    color: colors.text,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});
