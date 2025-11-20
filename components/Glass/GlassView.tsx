import React from 'react';
import { StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: any;
  children?: React.ReactNode;
}

export function GlassView({
  intensity = 80,
  tint = 'dark',
  style,
  children,
  ...props
}: GlassViewProps) {
  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(20,20,20,0.5)' : 'rgba(20,20,20,0.8)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
});
