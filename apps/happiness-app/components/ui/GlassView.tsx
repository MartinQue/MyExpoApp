import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { LAYOUT } from '@/constants/Layout';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  variant?: 'light' | 'medium' | 'strong';
}

export function GlassView({ 
  children, 
  style, 
  intensity, 
  variant = 'medium' 
}: GlassViewProps) {
  const { isDark } = useTheme();
  
  const blurIntensity = intensity ?? 
    (variant === 'light' ? 15 : variant === 'strong' ? 30 : 20);
  
  const backgroundColor = isDark
    ? variant === 'light' 
      ? 'rgba(40, 40, 60, 0.4)'
      : variant === 'strong'
      ? 'rgba(40, 40, 60, 0.8)'
      : 'rgba(40, 40, 60, 0.6)'
    : variant === 'light'
    ? 'rgba(255, 255, 255, 0.4)'
    : variant === 'strong'
    ? 'rgba(255, 255, 255, 0.8)'
    : 'rgba(255, 255, 255, 0.6)';
  
  return (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: `rgba(255, 255, 255, ${LAYOUT.GLASS_BORDER_OPACITY})`,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: LAYOUT.GLASS_BORDER_WIDTH,
    overflow: 'hidden',
  },
});
