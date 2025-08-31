// State badge component for civilization states

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CivState } from '../../types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ui } from '../../theme/ui';
import { animations, createAnimation } from '../../theme/animations';
import { Icon } from './Icon';

interface StateBadgeProps {
  state: CivState;
}

export const StateBadge: React.FC<StateBadgeProps> = ({ state }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate badge appearance with growth effect
    Animated.parallel([
      createAnimation('growth', scaleAnim),
      createAnimation('fadeIn', opacityAnim),
    ]).start();
  }, [state, scaleAnim, opacityAnim]);

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

  const getStateIcon = (civState: CivState) => {
    switch (civState) {
      case 'uninitialized':
        return 'uninitialized';
      case 'developing':
        return 'developing';
      case 'decaying':
        return 'decaying';
      case 'ocean':
        return 'ocean';
      default:
        return 'uninitialized';
    }
  };

  const getStateText = (civState: CivState) => {
    switch (civState) {
      case 'uninitialized':
        return '未初期化';
      case 'developing':
        return '発展中';
      case 'decaying':
        return '衰退中';
      case 'ocean':
        return '海洋化';
      default:
        return civState.charAt(0).toUpperCase() + civState.slice(1);
    }
  };

  const stateStyle = getStateStyle(state);
  const stateIcon = getStateIcon(state);

  return (
    <Animated.View 
      style={[
        styles.badge, 
        { 
          backgroundColor: stateStyle.backgroundColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <Icon 
        name={stateIcon} 
        size="xs" 
        color={stateStyle.color}
        style={styles.badgeIcon}
      />
      <Text style={[styles.badgeText, { color: stateStyle.color }]}>
        {getStateText(state)}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    ...ui.stateBadge,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  badgeIcon: {
    marginRight: spacing.xs / 2,
  },
  badgeText: {
    ...typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
