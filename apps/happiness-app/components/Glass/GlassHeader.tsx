/**
 * GlassHeader - Glassmorphic header component
 * Used for headers throughout the app with consistent blur and styling
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GlassHeaderProps {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function GlassHeader({
  children,
  intensity,
  style,
  safeAreaEdges = ['top'],
}: GlassHeaderProps) {
  const { colors, isDark } = useTheme();
  const resolvedIntensity = intensity ?? (isDark ? 80 : 60);

  return (
    <SafeAreaView edges={safeAreaEdges} style={styles.safeArea}>
      <BlurView
        intensity={resolvedIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.header,
          {
            backgroundColor: isDark
              ? 'rgba(0,0,0,0.5)'
              : 'rgba(255,255,255,0.7)',
            borderBottomColor: colors.glassBorder,
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    zIndex: 10,
  },
  header: {
    borderBottomWidth: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});






