// Simple toast notification component

import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  onHide,
  duration = 3000,
}) => {
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [visible, opacity, duration, onHide]);

  if (!visible) {
    return null;
  }

  const getToastStyle = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        return { backgroundColor: colors.success };
      case 'error':
        return { backgroundColor: colors.error };
      case 'info':
        return { backgroundColor: colors.primary };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getToastStyle(type),
        { opacity }
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 1000,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
