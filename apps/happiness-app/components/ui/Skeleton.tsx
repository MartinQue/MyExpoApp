/**
 * Skeleton Loading Component
 * Used for loading states in chat, Imagine gallery, and Library
 */

import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.glassBackground,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.cardContainer}>
      <Skeleton width="60%" height={16} borderRadius={4} />
      <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      <Skeleton width="80%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

export function SkeletonImage({ 
  aspectRatio = 1, 
  style 
}: { 
  aspectRatio?: number;
  style?: any;
}) {
  return <Skeleton width="100%" height={undefined} borderRadius={12} style={[{ aspectRatio }, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    padding: 16,
  },
});

