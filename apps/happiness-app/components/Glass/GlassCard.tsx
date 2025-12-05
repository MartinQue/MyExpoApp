import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { GlassView } from './GlassView';
import { BorderRadius, Spacing } from '@/constants/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 60 }: GlassCardProps) {
  return (
    <GlassView intensity={intensity} style={[styles.card, style]}>
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
});
