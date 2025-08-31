// Theme exports for Antiplanet
// Centralized theme system with colors, spacing, typography, UI, animations, and icons
// Using individual exports to avoid circular dependencies

export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { ui } from './ui';
export { 
  animations, 
  createAnimation, 
  createLoopAnimation,
  durations,
  easings,
  presets
} from './animations';
export { icons, iconSizes, getIconColor, type IconName, type IconSize } from './icons';
