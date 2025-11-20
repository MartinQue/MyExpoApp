import React from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, Typography } from '@/constants/Theme';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return Colors.gray[800];
    switch (variant) {
      case 'primary':
        return Colors.white;
      case 'secondary':
        return Colors.gray[800];
      case 'ghost':
        return 'transparent';
      case 'outline':
        return 'transparent';
      default:
        return Colors.white;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.gray[500];
    switch (variant) {
      case 'primary':
        return Colors.black;
      case 'secondary':
        return Colors.white;
      case 'ghost':
        return Colors.white;
      case 'outline':
        return Colors.white;
      default:
        return Colors.black;
    }
  };

  const getBorder = () => {
    if (variant === 'outline')
      return { borderWidth: 1, borderColor: Colors.gray[700] };
    return {};
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 12, paddingVertical: 6 };
      case 'md':
        return { paddingHorizontal: 16, paddingVertical: 10 };
      case 'lg':
        return { paddingHorizontal: 24, paddingVertical: 14 };
      case 'icon':
        return {
          width: 40,
          height: 40,
          padding: 0,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
        };
      default:
        return { paddingHorizontal: 16, paddingVertical: 10 };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: getBackgroundColor() },
        getBorder(),
        getPadding(),
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
});
