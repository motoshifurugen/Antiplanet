// Rich toast notification component with smooth animations

import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { ui } from '../../theme/ui';

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
  duration = 3000, // Reduced duration to 3 seconds for better UX
}) => {
  const [opacity] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0.8));
  const [translateY] = useState(new Animated.Value(-30));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let fallbackTimer: NodeJS.Timeout;

    if (visible) {
      setIsVisible(true);
      
      // Rich entrance animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after extended duration
      timer = setTimeout(() => {
        // Rich exit animation
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
            toValue: -30,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsVisible(false);
          onHide();
        });
        
        // Fallback: Force hide after animation duration + buffer
        fallbackTimer = setTimeout(() => {
          setIsVisible(false);
          onHide();
        }, duration + 1000); // 1 second buffer
      }, duration);
    } else {
      // Reset animation values when not visible
      opacity.setValue(0);
      scale.setValue(0.8);
      translateY.setValue(-30);
      setIsVisible(false);
    }

    // Cleanup function
    return () => {
      if (timer) clearTimeout(timer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [visible, opacity, scale, translateY, duration, onHide]);

  if (!visible || !isVisible) {
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
    zIndex: 99999,
    elevation: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  message: {
    ...typography.body,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
});
