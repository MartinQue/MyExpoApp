/**
 * GlassButton - Pill-shaped glassmorphic button
 * Used throughout the app for consistent glass button styling
 */

import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { GlassView } from './GlassView';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { button as hapticButton } from '@/lib/haptics';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  intensity?: number;
}

export function GlassButton({
  label,
  onPress,
  icon,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
  disabled = false,
  intensity,
}: GlassButtonProps) {
  const { colors } = useTheme();

  const sizeStyles = {
    small: { height: 36, paddingHorizontal: 16, fontSize: 14 },
    medium: { height: 44, paddingHorizontal: 20, fontSize: 15 },
    large: { height: 52, paddingHorizontal: 24, fontSize: 16 },
  };

  const variantStyles = {
    default: {
      backgroundColor: colors.glassBackground,
      borderColor: colors.glassBorder,
    },
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: `${colors.primary}20`,
      borderColor: `${colors.primary}40`,
    },
  };

  const handlePress = () => {
    if (disabled) return;
    hapticButton();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <GlassView
        intensity={intensity}
        style={[
          styles.button,
          {
            height: sizeStyles[size].height,
            paddingHorizontal: sizeStyles[size].paddingHorizontal,
            ...variantStyles[variant],
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={sizeStyles[size].fontSize + 2}
            color={
              variant === 'primary'
                ? colors.textInverse
                : variant === 'secondary'
                ? colors.primary
                : colors.text
            }
            style={styles.icon}
          />
        )}
        <Text
          style={[
            styles.label,
            {
              fontSize: sizeStyles[size].fontSize,
              color:
                variant === 'primary'
                  ? colors.textInverse
                  : variant === 'secondary'
                  ? colors.primary
                  : colors.text,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    borderRadius: 999, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minWidth: 80,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    marginRight: 8,
  },
});

