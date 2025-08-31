// UI Styling Rules for Antiplanet
// Card-based design with warm civilization growth theme
// Optimized for dark theme with excellent readability in all lighting conditions

import { colors } from './colors';
import { spacing } from './spacing';

export const ui = {
  // Card Design - Civilization as unit of growth
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    // Enhanced glow effect for better visibility
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  
  cardSecondary: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Button Styles - Enhanced for better visibility
  button: {
    primary: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      // Enhanced glow effect for growth
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    success: {
      backgroundColor: colors.success,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.success,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    warning: {
      backgroundColor: colors.warning,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.warning,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    error: {
      backgroundColor: colors.error,
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 2,
      borderColor: colors.primary,
      // Subtle glow for outline buttons
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      padding: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      // Very subtle border for ghost buttons
      borderWidth: 1,
      borderColor: colors.border,
    },
  },

  // Input Styles - Enhanced for better visibility
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    // Enhanced focus state
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSecondary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.surfaceSecondary,
    shadowColor: colors.error,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  // State Badge - Enhanced pill-shaped with state colors
  stateBadge: {
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    // Enhanced glow effect for better visibility
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },

  // Modal Styles - Enhanced for better visibility
  modal: {
    backgroundColor: colors.modalBackground,
    borderRadius: 20,
    // Enhanced glow effect
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },

  // Toast Styles - Enhanced for better visibility
  toast: {
    borderRadius: 16,
    padding: spacing.md,
    // Enhanced glow effect matching type
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  // Navigation and header styles
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    // Subtle glow for header
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // List and section styles
  listItem: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    padding: spacing.md,
  },

  // Divider styles
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },

  // Spacing System
  spacing: {
    card: spacing.md,
    section: spacing.lg,
    screen: spacing.xl,
  },
} as const;

export type UIComponent = keyof typeof ui;
