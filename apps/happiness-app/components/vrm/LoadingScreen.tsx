import React from 'react';
import { View, Text, StyleSheet, AccessibilityInfo, Platform } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface LoadingScreenProps {
  visible: boolean;
  progress: number; // 0–100
  mode: 'light' | 'dark';
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export function LoadingScreen({ visible, progress, mode }: LoadingScreenProps) {
  const hue = useSharedValue(0);

  React.useEffect(() => {
    if (!visible) return;
    hue.value = withRepeat(withTiming(360, { duration: 6000 }), -1, false);
  }, [visible, hue]);

  React.useEffect(() => {
    if (visible) {
      const pct = Math.round(progress);
      const message = `Avatar loading ${pct} percent`;
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility?.(message);
      }
    }
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const startColor = interpolateColor(
      hue.value,
      [0, 180, 360],
      mode === 'dark'
        ? ['#3B1D60', '#141433', '#3B1D60']
        : ['#F4D0FF', '#E2E8F0', '#F4D0FF']
    );
    return {
      backgroundColor: startColor,
    };
  });

  if (!visible) return null;

  const displayProgress = Math.round(progress);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, animatedStyle]}>
      <AnimatedBlur intensity={60} tint={mode} style={styles.blurLayer}>
        <View style={styles.overlay} />
      </AnimatedBlur>
      <View style={styles.content}>
        <View style={styles.spinnerRing}>
          <Animated.View style={styles.spinnerDot} />
        </View>
        <Text style={[styles.title, mode === 'dark' ? styles.textDark : styles.textLight]}>
          Preparing your companion
        </Text>
        <Text style={[styles.subtitle, mode === 'dark' ? styles.textDarkMuted : styles.textLightMuted]}>
          {`Downloading assets ${displayProgress}%`}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  blurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 20, 0.35)',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  spinnerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  textDark: {
    color: 'rgba(255,255,255,0.95)',
  },
  textDarkMuted: {
    color: 'rgba(255,255,255,0.7)',
  },
  textLight: {
    color: 'rgba(20,20,25,0.9)',
  },
  textLightMuted: {
    color: 'rgba(20,20,25,0.6)',
  },
});
