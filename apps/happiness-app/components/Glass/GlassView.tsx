import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
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
  const resolvedTint = tint ?? (isDark ? 'dark' : 'light');
  const resolvedIntensity = intensity ?? (isDark ? 80 : 40);

  return (
    <BlurView
      intensity={resolvedIntensity}
      tint={resolvedTint}
      style={[
        styles.glass, 
        { 
          borderColor: isDark 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(45, 42, 38, 0.08)',
        },
        style
      ]}
      {...props}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 253, 250, 0.6)',
          },
        ]}
      >
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  inner: {
    flex: 1,
  },
});
