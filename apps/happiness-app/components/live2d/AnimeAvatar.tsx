import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarState } from './AvatarController';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ANIME_AVATARS: Record<string, { idle: string; happy: string; speaking: string }> = {
  hiyori: {
    idle: 'https://i.pinimg.com/originals/d8/2e/9f/d82e9f5acb3c04fc01c4a3cc04e0c6e5.png',
    happy: 'https://i.pinimg.com/originals/d8/2e/9f/d82e9f5acb3c04fc01c4a3cc04e0c6e5.png',
    speaking: 'https://i.pinimg.com/originals/d8/2e/9f/d82e9f5acb3c04fc01c4a3cc04e0c6e5.png',
  },
  haru: {
    idle: 'https://i.pinimg.com/originals/3d/2f/c9/3d2fc97d5acb5d56d6a8c9e8a4e8f5b7.png',
    happy: 'https://i.pinimg.com/originals/3d/2f/c9/3d2fc97d5acb5d56d6a8c9e8a4e8f5b7.png',
    speaking: 'https://i.pinimg.com/originals/3d/2f/c9/3d2fc97d5acb5d56d6a8c9e8a4e8f5b7.png',
  },
  shizuku: {
    idle: 'https://i.pinimg.com/originals/a2/5c/7e/a25c7e5b6c4f8d2e9a3b1c0d4e5f6a7b.png',
    happy: 'https://i.pinimg.com/originals/a2/5c/7e/a25c7e5b6c4f8d2e9a3b1c0d4e5f6a7b.png',
    speaking: 'https://i.pinimg.com/originals/a2/5c/7e/a25c7e5b6c4f8d2e9a3b1c0d4e5f6a7b.png',
  },
  mao: {
    idle: 'https://i.pinimg.com/originals/8f/9a/2b/8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c.png',
    happy: 'https://i.pinimg.com/originals/8f/9a/2b/8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c.png',
    speaking: 'https://i.pinimg.com/originals/8f/9a/2b/8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c.png',
  },
  hijiki: {
    idle: 'https://i.pinimg.com/originals/c1/d2/e3/c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.png',
    happy: 'https://i.pinimg.com/originals/c1/d2/e3/c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.png',
    speaking: 'https://i.pinimg.com/originals/c1/d2/e3/c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6.png',
  },
  tororo: {
    idle: 'https://i.pinimg.com/originals/f5/e6/d7/f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0.png',
    happy: 'https://i.pinimg.com/originals/f5/e6/d7/f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0.png',
    speaking: 'https://i.pinimg.com/originals/f5/e6/d7/f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0.png',
  },
};

interface AnimeAvatarProps {
  model: string;
  state: AvatarState;
  isSpeaking: boolean;
  primaryColor?: string;
  style?: any;
}

export default function AnimeAvatar({
  model,
  state,
  isSpeaking,
  primaryColor = '#8B5CF6',
  style
}: AnimeAvatarProps) {
  const breatheScale = useSharedValue(1);
  const bounceY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const mouthScale = useSharedValue(0);
  const eyeScale = useSharedValue(1);
  const headTilt = useSharedValue(0);
  const pulseRing = useSharedValue(1);
  
  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    const blinkInterval = setInterval(() => {
      eyeScale.value = withSequence(
        withTiming(0.1, { duration: 80 }),
        withTiming(1, { duration: 80 })
      );
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    cancelAnimation(bounceY);
    cancelAnimation(headTilt);
    cancelAnimation(glowOpacity);
    cancelAnimation(pulseRing);

    switch (state) {
      case 'idle':
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        glowOpacity.value = withTiming(0.3, { duration: 300 });
        headTilt.value = withTiming(0, { duration: 300 });
        break;

      case 'listening':
        glowOpacity.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 600 }),
            withTiming(0.4, { duration: 600 })
          ),
          -1,
          true
        );
        headTilt.value = withTiming(-5, { duration: 300 });
        pulseRing.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        );
        break;

      case 'thinking':
        headTilt.value = withRepeat(
          withSequence(
            withTiming(8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(-8, { duration: 1000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        glowOpacity.value = withTiming(0.5, { duration: 300 });
        break;

      case 'speaking':
        glowOpacity.value = withTiming(0.7, { duration: 200 });
        bounceY.value = withRepeat(
          withSequence(
            withTiming(-5, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          -1,
          true
        );
        break;

      case 'happy':
        bounceY.value = withSequence(
          withSpring(-15, { damping: 8 }),
          withSpring(0, { damping: 10 })
        );
        glowOpacity.value = withTiming(0.9, { duration: 200 });
        break;

      case 'surprised':
        breatheScale.value = withSequence(
          withSpring(1.15, { damping: 6 }),
          withSpring(1.02, { damping: 10 })
        );
        glowOpacity.value = withTiming(1, { duration: 100 });
        break;

      case 'sad':
        bounceY.value = withTiming(5, { duration: 500 });
        glowOpacity.value = withTiming(0.2, { duration: 500 });
        headTilt.value = withTiming(-10, { duration: 500 });
        break;
    }
  }, [state]);

  useEffect(() => {
    if (isSpeaking) {
      mouthScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 100 + Math.random() * 100 }),
          withTiming(0.3, { duration: 100 + Math.random() * 100 })
        ),
        -1,
        true
      );
    } else {
      mouthScale.value = withTiming(0, { duration: 150 });
    }
  }, [isSpeaking]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breatheScale.value },
      { translateY: bounceY.value },
      { rotate: `${headTilt.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseRing.value }],
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(mouthScale.value, [0, 1], [0.3, 1], Extrapolation.CLAMP) }],
    opacity: interpolate(mouthScale.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
  }));

  const eyeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyeScale.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.glowRing, glowStyle, { borderColor: primaryColor }]} />
      
      <Animated.View style={[styles.avatarContainer, containerStyle]}>
        <LinearGradient
          colors={[`${primaryColor}40`, `${primaryColor}20`, 'transparent']}
          style={styles.avatarGlow}
        />
        
        <View style={[styles.avatarCircle, { backgroundColor: primaryColor }]}>
          <LinearGradient
            colors={[`${primaryColor}`, `${primaryColor}CC`, `${primaryColor}99`]}
            style={styles.avatarGradient}
          />
          
          <View style={styles.faceContainer}>
            <View style={styles.eyesRow}>
              <Animated.View style={[styles.eyeOuter, eyeAnimStyle]}>
                <View style={styles.eyeInner}>
                  <View style={styles.eyeHighlight} />
                </View>
              </Animated.View>
              <Animated.View style={[styles.eyeOuter, eyeAnimStyle]}>
                <View style={styles.eyeInner}>
                  <View style={styles.eyeHighlight} />
                </View>
              </Animated.View>
            </View>
            
            {state === 'happy' && (
              <View style={styles.blushContainer}>
                <View style={[styles.blush, { backgroundColor: '#FFB7C5' }]} />
                <View style={[styles.blush, { backgroundColor: '#FFB7C5' }]} />
              </View>
            )}
            
            <Animated.View style={[styles.mouth, mouthStyle]}>
              <View style={styles.mouthInner} />
            </Animated.View>
          </View>
        </View>
        
        {(state === 'speaking' || isSpeaking) && (
          <View style={styles.soundWaves}>
            {[0, 1, 2].map((i) => (
              <SoundWave key={i} delay={i * 100} color={primaryColor} />
            ))}
          </View>
        )}
      </Animated.View>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { 
          backgroundColor: state === 'idle' ? '#10B981' : 
                          state === 'listening' ? '#8B5CF6' :
                          state === 'thinking' ? '#3B82F6' :
                          state === 'speaking' ? '#10B981' :
                          state === 'happy' ? '#F59E0B' :
                          state === 'sad' ? '#6B7280' : primaryColor
        }]} />
      </View>
    </View>
  );
}

function SoundWave({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0.8, { duration: 0 })
        ),
        -1
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0.8, { duration: 0 })
        ),
        -1
      )
    );
  }, []);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.soundWave, waveStyle, { borderColor: color }]} />
  );
}

const AVATAR_SIZE = 180;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: AVATAR_SIZE + 40,
    height: AVATAR_SIZE + 40,
    borderRadius: (AVATAR_SIZE + 40) / 2,
    borderWidth: 2,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: AVATAR_SIZE + 60,
    height: AVATAR_SIZE + 60,
    borderRadius: (AVATAR_SIZE + 60) / 2,
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  avatarGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: AVATAR_SIZE / 2,
  },
  faceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 36,
  },
  eyeOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  eyeInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeHighlight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  blushContainer: {
    position: 'absolute',
    top: '40%',
    flexDirection: 'row',
    gap: 80,
  },
  blush: {
    width: 20,
    height: 10,
    borderRadius: 10,
    opacity: 0.6,
  },
  mouth: {
    width: 24,
    height: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    marginTop: 4,
  },
  mouthInner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '60%',
    backgroundColor: '#FF6B8A',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  soundWaves: {
    position: 'absolute',
    width: AVATAR_SIZE + 80,
    height: AVATAR_SIZE + 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundWave: {
    position: 'absolute',
    width: AVATAR_SIZE + 40,
    height: AVATAR_SIZE + 40,
    borderRadius: (AVATAR_SIZE + 40) / 2,
    borderWidth: 2,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
