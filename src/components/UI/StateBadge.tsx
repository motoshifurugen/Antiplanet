// State badge component for civilization states

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CivState } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface StateBadgeProps {
  state: CivState;
}

export const StateBadge: React.FC<StateBadgeProps> = ({ state }) => {
  const getStateStyle = (civState: CivState) => {
    switch (civState) {
      case 'uninitialized':
        return {
          backgroundColor: colors.border,
          color: colors.textSecondary,
        };
      case 'developing':
        return {
          backgroundColor: colors.success,
          color: '#FFFFFF',
        };
      case 'decaying':
        return {
          backgroundColor: colors.warning,
          color: '#FFFFFF',
        };
      case 'ocean':
        return {
          backgroundColor: colors.primary,
          color: '#FFFFFF',
        };
      default:
        return {
          backgroundColor: colors.border,
          color: colors.textSecondary,
        };
    }
  };

  const stateStyle = getStateStyle(state);

  return (
    <View style={[styles.badge, { backgroundColor: stateStyle.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: stateStyle.color }]}>
        {state.charAt(0).toUpperCase() + state.slice(1)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
