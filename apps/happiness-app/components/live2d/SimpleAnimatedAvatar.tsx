import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AvatarState } from './AvatarController';

interface SimpleAnimatedAvatarProps {
  state: AvatarState;
  isSpeaking: boolean;
  style?: any;
}

/**
 * SimpleAnimatedAvatar - Fallback animated avatar using Reanimated
 *
 * Features:
 * - Breathing animation when idle
 * - Pulsing when listening
 * - Thinking rotation
 * - Speaking scale animation with mouth movement
 * - Expression-based colors
 *
 * This is a lightweight alternative to Live2D that works immediately
 */
export default function SimpleAnimatedAvatar({
  state,
  isSpeaking,
  style
}: SimpleAnimatedAvatarProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const mouthScale = useSharedValue(0.4);

  // Breathing animation for idle
  useEffect(() => {
    if (state === 'idle') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [state]);

  // Pulsing animation when listening
  useEffect(() => {
    if (state === 'listening') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [state]);

  // Thinking animation (subtle rotation)
  useEffect(() => {
    if (state === 'thinking') {
      rotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [state]);

  // Speaking animation (scale + mouth movement)
  useEffect(() => {
    if (state === 'speaking' || isSpeaking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.02, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      // Mouth movement
      mouthScale.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 150 }),
          withTiming(0.4, { duration: 150 })
        ),
        -1,
        false
      );
    } else {
      mouthScale.value = withTiming(0.4, { duration: 200 });
    }
  }, [state, isSpeaking]);

  // Happy bounce
  useEffect(() => {
    if (state === 'happy') {
      scale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 300 })
      );
    }
  }, [state]);

  // Surprised jump
  useEffect(() => {
    if (state === 'surprised') {
      scale.value = withSequence(
        withTiming(1.3, { duration: 150 }),
        withTiming(1.05, { duration: 200 })
      );
    }
  }, [state]);

  // Sad slow breathing
  useEffect(() => {
    if (state === 'sad') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [state]);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const mouthAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: mouthScale.value }],
  }));

  // Get color based on state
  const getStateColor = () => {
    switch (state) {
      case 'listening':
        return '#8B5CF6'; // Purple
      case 'thinking':
        return '#3B82F6'; // Blue
      case 'speaking':
        return '#10B981'; // Green
      case 'happy':
        return '#F59E0B'; // Orange
      case 'surprised':
        return '#EC4899'; // Pink
      case 'sad':
        return '#6B7280'; // Gray
      default:
        return '#A78BFA'; // Light purple (idle)
    }
  };

  const stateColor = getStateColor();

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.avatar, avatarAnimatedStyle]}>
        {/* Avatar circle background */}
        <View style={[styles.avatarCircle, { backgroundColor: stateColor }]}>
          {/* Face */}
          <View style={styles.face}>
            {/* Eyes */}
            <View style={styles.eyesContainer}>
              <View style={[styles.eye, state === 'thinking' && styles.eyeThinking]}>
                <View style={styles.pupil} />
              </View>
              <View style={[styles.eye, state === 'thinking' && styles.eyeThinking]}>
                <View style={styles.pupil} />
              </View>
            </View>

            {/* Mouth */}
            <Animated.View style={[styles.mouth, mouthAnimatedStyle]}>
              <Ionicons
                name={
                  state === 'happy' ? 'happy' :
                  state === 'sad' ? 'sad' :
                  state === 'surprised' ? 'ellipse' :
                  (state === 'speaking' || isSpeaking) ? 'ellipse-outline' :
                  'remove-outline'
                }
                size={32}
                color="rgba(0, 0, 0, 0.6)"
              />
            </Animated.View>
          </View>
        </View>

        {/* Glow effect */}
        <View style={[styles.glow, { backgroundColor: stateColor }]} />
      </Animated.View>

      {/* State indicator */}
      <View style={styles.stateIndicator}>
        <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
    zIndex: -1,
  },
  face: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  eyesContainer: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 30,
  },
  eye: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeThinking: {
    width: 28,
    height: 16,
    borderRadius: 14,
  },
  pupil: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  mouth: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIndicator: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  stateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
