// Animation and Feedback System for Antiplanet
// Growth, decline, and interaction animations

import { Animated, Easing } from 'react-native';

// Centralized animation settings
export const durations = {
  fast: 150,
  normal: 250,
  slow: 350,
  growth: 800,
  decline: 1200,
  pulse: 1000,
} as const;

export const easings = {
  // Standard easing functions
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  
  // Special easing functions
  easeOutBack: Easing.out(Easing.back(1.2)),
  easeOutBackLight: Easing.out(Easing.back(1.1)),
  easeOutEase: Easing.out(Easing.ease),
  easeInOutEase: Easing.inOut(Easing.ease),
} as const;

export const animations = {
  // Growth Animation - Flower blooming effect
  growth: {
    scale: {
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    },
    opacity: {
      inputRange: [0, 1],
      outputRange: [0, 1],
    },
    duration: durations.growth,
    easing: easings.easeOutBack,
  },

  // Decline Animation - Gradual desaturation
  decline: {
    opacity: {
      inputRange: [0, 1],
      outputRange: [1, 0.6],
    },
    scale: {
      inputRange: [0, 1],
      outputRange: [1, 0.95],
    },
    duration: durations.decline,
    easing: easings.easeInOutEase,
  },

  // Press Feedback - Slight scale + glow intensification
  press: {
    scale: {
      inputRange: [0, 1],
      outputRange: [1, 1.02],
    },
    duration: durations.fast,
    easing: easings.easeOutBackLight,
  },

  // Hover/Active State - Glow intensification
  active: {
    shadowOpacity: {
      inputRange: [0, 1],
      outputRange: [0.1, 0.3],
    },
    shadowRadius: {
      inputRange: [0, 1],
      outputRange: [8, 12],
    },
    duration: durations.normal,
    easing: easings.easeOutEase,
  },

  // Fade In - Gentle appearance
  fadeIn: {
    opacity: {
      inputRange: [0, 1],
      outputRange: [0, 1],
    },
    translateY: {
      inputRange: [0, 1],
      outputRange: [20, 0],
    },
    duration: 600,
    easing: easings.easeOutEase,
  },

  // Slide Up - Modal appearance
  slideUp: {
    translateY: {
      inputRange: [0, 1],
      outputRange: [300, 0],
    },
    opacity: {
      inputRange: [0, 1],
      outputRange: [0, 1],
    },
    duration: 400,
    easing: easings.easeOutBack,
  },

  // Pulse - Attention drawing
  pulse: {
    scale: {
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.05, 1],
    },
    duration: durations.pulse,
    easing: easings.easeInOutEase,
  },
} as const;

export type AnimationType = keyof typeof animations;

// Animation utility functions
export const createAnimation = (type: AnimationType, value: Animated.Value) => {
  const config = animations[type];
  return Animated.timing(value, {
    toValue: 1,
    duration: config.duration,
    easing: config.easing,
    useNativeDriver: true,
  });
};

export const createLoopAnimation = (type: AnimationType, value: Animated.Value) => {
  const config = animations[type];
  return Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration: config.duration,
      easing: config.easing,
      useNativeDriver: true,
    })
  );
};

// Helper presets for common interactions
export const presets = {
  pressIn: {
    scale: 0.98,
    duration: durations.fast,
    easing: easings.easeOutEase,
  },
  pressOut: {
    scale: 1,
    duration: durations.fast,
    easing: easings.easeOutEase,
  },
  focus: {
    scale: 1.02,
    duration: durations.normal,
    easing: easings.easeOutEase,
  },
} as const;
