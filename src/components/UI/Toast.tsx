// Simple toast notification component

import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ui } from '../../theme/ui';
import { animations, createAnimation } from '../../theme/animations';

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
  const [scale] = useState(new Animated.Value(0.8));
  const [translateY] = useState(new Animated.Value(-20));

  useEffect(() => {
    if (visible) {
      // Entrance animation with growth effect
      Animated.parallel([
        createAnimation('fadeIn', opacity),
        createAnimation('growth', scale),
        createAnimation('fadeIn', translateY),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        // Exit animation
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -20,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, scale, translateY, duration, onHide]);

  if (!visible) {
    return null;
  }

  const getToastStyle = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        return { 
          backgroundColor: colors.success,
          shadowColor: colors.success,
        };
      case 'error':
        return { 
          backgroundColor: colors.error,
          shadowColor: colors.error,
        };
      case 'info':
        return { 
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        };
      default:
        return { 
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        };
    }
  };

  const toastStyle = getToastStyle(type);

  return (
    <Animated.View 
      style={[
        styles.container, 
        toastStyle,
        { 
          opacity,
          transform: [
            { scale },
            { translateY }
          ]
        }
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...ui.toast,
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
    elevation: 1000,
  },
  message: {
    ...typography.caption,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
