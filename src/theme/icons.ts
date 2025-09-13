// Icon System for Antiplanet
// Consistent icon usage with lucide-react-native
// No emojis - only professional, themed icons

import {
  Globe,
  Settings,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Circle,
  Clock,
  Target,
  Users,
  TrendingUp,
  TrendingDown,
  Zap,
  Star,
  Home,
  MapPin,
  Calendar,
  BookOpen,
  Lightbulb,
  TreePine,
  Building,
  Building2,
  type LucideIcon,
} from 'lucide-react-native';
import { colors } from './colors';

// Icon size constants
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
} as const;

export type IconSize = keyof typeof iconSizes;

// Icon mapping for different contexts
export const icons = {
  // Navigation and main sections
  planet: Globe,
  settings: Settings,
  home: Home,
  civilizations: Users,
  progress: TrendingUp,
  
  // Actions
  add: Plus,
  edit: Edit3,
  delete: Trash2,
  save: CheckCircle,
  confirm: CheckCircle,
  
  // Civilization states (legacy)
  uninitialized: Circle,
  developing: TrendingUp,
  decaying: TrendingDown,
  ocean: Globe,
  
  // Civilization levels (new system)
  grassland: TreePine,
  village: Home,
  town: Building,
  city: Building2,
  
  // Status and feedback
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Lightbulb,
  
  // Time and scheduling
  deadline: Target,
  calendar: Calendar,
  clock: Clock,
  history: BookOpen,
  
  // Special effects
  highlight: Star,
  power: Zap,
  location: MapPin,
} as const;

export type IconName = keyof typeof icons;

// Icon color mapping based on context and state
export const getIconColor = (name: IconName, variant?: 'default' | 'success' | 'warning' | 'error' | 'info'): string => {
  // State-specific colors
  if (variant) {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.primary;
      default:
        break;
    }
  }
  
  // Context-specific colors
  switch (name) {
    case 'success':
    case 'confirm':
    case 'developing':
      return colors.success;
    case 'warning':
    case 'decaying':
      return colors.warning;
    case 'error':
    case 'delete':
      return colors.error;
    case 'info':
      return colors.primary;
    case 'highlight':
      return colors.accent;
    case 'add':
    case 'progress':
      return colors.primary;
    case 'planet':
      return colors.secondary;
    default:
      return colors.textSecondary;
  }
};

// Icon component props interface
export interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  strokeWidth?: number;
}

// Default icon styling
export const defaultIconProps = {
  strokeWidth: 2,
  size: 'md' as IconSize,
} as const;
