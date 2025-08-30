export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  text: '#000000',
  textSecondary: '#3C3C43',
  border: '#C7C7CC',
  placeholder: '#8E8E93',
} as const;

export const darkColors = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  border: '#38383A',
  placeholder: '#8E8E93',
} as const;

export type ColorScheme = typeof colors;
