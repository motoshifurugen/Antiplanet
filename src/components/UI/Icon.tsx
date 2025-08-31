// Icon component for Antiplanet
// Consistent icon rendering with proper theming

import React from 'react';
import { ViewStyle } from 'react-native';
import { icons, iconSizes, getIconColor, type IconName, type IconSize } from '../../theme/icons';

interface IconProps {
  name: IconName;
  size?: IconSize | number;
  color?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  strokeWidth?: number;
  style?: ViewStyle;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  variant,
  strokeWidth = 2,
  style,
}) => {
  const IconComponent = icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon system`);
    return null;
  }

  const iconSize = typeof size === 'string' ? iconSizes[size] : size;
  const iconColor = color || getIconColor(name, variant);

  return (
    <IconComponent
      size={iconSize}
      color={iconColor}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};
