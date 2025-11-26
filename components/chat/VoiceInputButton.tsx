/**
 * VoiceInputButton - Animated voice recording button with transcription
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useVoice } from '@/lib/voice';
import { useTheme } from '@/contexts/ThemeContext';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  size?: number;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  size = 44,
  disabled = false,
}: VoiceInputButtonProps) {
  const { colors, isDark } = useTheme();
  const {
    isRecording,
    isTranscribing,
    duration,
    error,
    transcript,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
  } = useVoice();

  // Animation values
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Handle transcript result
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  // Recording animation
  useEffect(() => {
    if (isRecording) {
      // Pulse animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        false
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withSpring(1);
    }
  }, [isRecording, pulseScale]);

  // Transcribing animation
  useEffect(() => {
    if (isTranscribing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withSpring(0);
    }
  }, [isTranscribing, rotation]);

  const handlePressIn = useCallback(async () => {
    if (disabled || isTranscribing) return;

    scale.value = withSpring(0.9);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await startRecording();
  }, [disabled, isTranscribing, scale, startRecording]);

  const handlePressOut = useCallback(async () => {
    if (!isRecording) return;

    scale.value = withSpring(1);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await stopRecording();
  }, [isRecording, scale, stopRecording]);

  const handleLongPressCancel = useCallback(async () => {
    if (!isRecording) return;

    scale.value = withSpring(1);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await cancelRecording();
  }, [isRecording, scale, cancelRecording]);

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: isRecording ? 0.3 : 0,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonColor = () => {
    if (isRecording) return '#FF3B30'; // Recording red
    if (isTranscribing) return colors.primary;
    return isDark ? '#333' : '#E5E5E5';
  };

  const getIconColor = () => {
    if (isRecording || isTranscribing) return '#FFF';
    return colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Pulse effect */}
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * 1.5,
            height: size * 1.5,
            borderRadius: size * 0.75,
            backgroundColor: '#FF3B30',
          },
          pulseAnimatedStyle,
        ]}
      />

      {/* Main button */}
      <Animated.View style={buttonAnimatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPressCancel}
          delayLongPress={2000}
          disabled={disabled}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: getButtonColor(),
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {isTranscribing ? (
            <Animated.View style={iconAnimatedStyle}>
              <ActivityIndicator size="small" color={getIconColor()} />
            </Animated.View>
          ) : (
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={size * 0.5}
              color={getIconColor()}
            />
          )}
        </Pressable>
      </Animated.View>

      {/* Duration indicator */}
      {isRecording && (
        <View
          style={[
            styles.durationContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.recordingDot} />
          <Text style={[styles.durationText, { color: colors.text }]}>
            {formatDuration(duration)}
          </Text>
        </View>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <View
          style={[
            styles.transcribingContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[styles.transcribingText, { color: colors.textSecondary }]}
          >
            Transcribing...
          </Text>
        </View>
      )}

      {/* Error indicator */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  durationContainer: {
    position: 'absolute',
    top: -30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transcribingContainer: {
    position: 'absolute',
    top: -30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transcribingText: {
    fontSize: 11,
    fontWeight: '500',
  },
  errorContainer: {
    position: 'absolute',
    top: -30,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFF',
  },
});

export default VoiceInputButton;
