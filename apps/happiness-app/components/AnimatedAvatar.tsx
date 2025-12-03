import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface AnimatedAvatarProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: number;
  fullScreen?: boolean;
}

export function AnimatedAvatar({
  isListening = false,
  isSpeaking = false,
  isThinking = false,
  size = 150,
  fullScreen = false,
}: AnimatedAvatarProps) {
  const finalSize = fullScreen ? width * 0.8 : size;

  // Animation Values
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.5);
  const coreScale = useSharedValue(1);

  useEffect(() => {
    // Continuous slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Breathing animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [pulse, rotation]);

  useEffect(() => {
    if (isSpeaking) {
      // Rapid pulsing when speaking
      coreScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(0.9, { duration: 300 })
        ),
        -1,
        true
      );
      glowOpacity.value = withTiming(0.8);
    } else if (isThinking) {
        // Thinking state - slower deep pulse
        coreScale.value = withRepeat(
            withSequence(
              withTiming(1.15, { duration: 1500 }),
              withTiming(0.85, { duration: 1500 })
            ),
            -1,
            true
        );
        glowOpacity.value = withTiming(0.6);
    } else if (isListening) {
      // Gentle expansion when listening
      coreScale.value = withTiming(1.1, { duration: 500 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(0.7, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      // Idle state
      coreScale.value = withTiming(1, { duration: 500 });
      glowOpacity.value = withTiming(0.5, { duration: 500 });
    }
  }, [isSpeaking, isListening, isThinking, coreScale, glowOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      {
        scale: interpolate(
          coreScale.value,
          [0.8, 1.2],
          [1, 1.5],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return (
    <View style={[styles.container, { width: finalSize, height: finalSize }]}>
      <Animated.View style={[styles.wrapper, containerStyle]}>
        {/* Outer Glow */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient
            colors={[
              'rgba(59, 130, 246, 0.5)',
              'rgba(168, 85, 247, 0.5)',
              'transparent',
            ]}
            style={styles.gradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Core Orb */}
        <Animated.View style={[styles.coreContainer, coreStyle]}>
          <LinearGradient
            colors={['#60A5FA', '#A855F7', '#EC4899']}
            style={styles.coreGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <BlurView intensity={40} tint="light" style={styles.blurOverlay} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: '150%',
    height: '150%',
    borderRadius: 999,
  },
  gradient: {
    flex: 1,
    borderRadius: 999,
  },
  coreContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  coreGradient: {
    flex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
