import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: any;
  children?: React.ReactNode;
}

export function GlassView({
  intensity,
  tint,
  style,
  children,
  ...props
}: GlassViewProps) {
  const { colors, isDark } = useTheme();
  const resolvedIntensity = intensity ?? colors.blurIntensity;
  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');

  return (
    <BlurView
      intensity={resolvedIntensity}
      tint={resolvedTint}
      style={[
        styles.container,
        {
          backgroundColor: colors.glassBackground,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
});
