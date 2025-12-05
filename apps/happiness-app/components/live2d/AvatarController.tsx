import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Live2DAvatar, { Live2DAvatarRef, Live2DExpression, Live2DModel } from './Live2DAvatar';
import SimpleAnimatedAvatar from './SimpleAnimatedAvatar';

// Avatar state
export type AvatarState =
  | 'idle'      // Standing by, neutral expression
  | 'listening' // User is speaking, attentive expression
  | 'thinking'  // Processing user input, thoughtful expression
  | 'speaking'  // AI is responding, animated lip sync
  | 'happy'     // Positive response, cheerful expression
  | 'surprised' // Unexpected input, surprised expression
  | 'sad';      // Negative sentiment, empathetic expression

// Map avatar states to Live2D expressions
const STATE_TO_EXPRESSION: Record<AvatarState, Live2DExpression> = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  happy: 'happy',
  surprised: 'surprised',
  sad: 'sad',
};

// Use simple animated avatar by default (Live2D can be enabled later)
const USE_SIMPLE_AVATAR = true;

interface AvatarControllerProps {
  model?: Live2DModel;
  state?: AvatarState;
  isSpeaking?: boolean;
  onReady?: () => void;
  onModelLoaded?: (modelName: string) => void;
  onError?: (error: string) => void;
  style?: any;
}

/**
 * AvatarController manages Live2D avatar state and animations
 *
 * Features:
 * - Automatic expression changes based on state
 * - Lip sync animation when speaking
 * - Smooth transitions between states
 * - Model selection support
 *
 * Usage:
 * ```tsx
 * <AvatarController
 *   model="hiyori"
 *   state="listening"
 *   isSpeaking={false}
 *   onReady={() => console.log('Avatar ready')}
 * />
 * ```
 */
export default function AvatarController({
  model = 'hiyori',
  state = 'idle',
  isSpeaking = false,
  onReady,
  onModelLoaded,
  onError,
  style
}: AvatarControllerProps) {
  const avatarRef = useRef<Live2DAvatarRef>(null);
  const currentStateRef = useRef<AvatarState>(state);
  const isSpeakingRef = useRef(isSpeaking);

  // Update expression when state changes
  useEffect(() => {
    if (!avatarRef.current) return;

    const expression = STATE_TO_EXPRESSION[state] || 'idle';
    console.log('🎭 Avatar state changed:', state, '→', expression);

    avatarRef.current.setExpression(expression);
    currentStateRef.current = state;
  }, [state]);

  // Handle lip sync when speaking
  useEffect(() => {
    if (!avatarRef.current) return;

    if (isSpeaking && !isSpeakingRef.current) {
      // Start speaking
      console.log('🗣️ Avatar started speaking');
      avatarRef.current.startLipSync();
      isSpeakingRef.current = true;
    } else if (!isSpeaking && isSpeakingRef.current) {
      // Stop speaking
      console.log('🤐 Avatar stopped speaking');
      avatarRef.current.stopLipSync();
      isSpeakingRef.current = false;
    }
  }, [isSpeaking]);

  // Change model when prop changes
  useEffect(() => {
    if (!avatarRef.current) return;

    console.log('🎭 Loading model:', model);
    avatarRef.current.loadModel(model);
  }, [model]);

  const handleReady = useCallback(() => {
    console.log('✅ Avatar controller ready');
    onReady?.();
  }, [onReady]);

  const handleModelLoaded = useCallback((modelName: string) => {
    console.log('✅ Model loaded in controller:', modelName);
    onModelLoaded?.(modelName);
  }, [onModelLoaded]);

  const handleError = useCallback((error: string) => {
    console.error('❌ Avatar controller error:', error);
    onError?.(error);
  }, [onError]);

  // Use simple animated avatar for immediate display
  if (USE_SIMPLE_AVATAR) {
    return (
      <View style={[styles.container, style]}>
        <SimpleAnimatedAvatar
          state={state}
          isSpeaking={isSpeaking}
          style={styles.avatar}
        />
      </View>
    );
  }

  // Live2D avatar (for future use when WebView is fully tested)
  return (
    <View style={[styles.container, style]}>
      <Live2DAvatar
        ref={avatarRef}
        initialModel={model}
        initialExpression={STATE_TO_EXPRESSION[state]}
        onReady={handleReady}
        onModelLoaded={handleModelLoaded}
        onError={handleError}
        style={styles.avatar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  avatar: {
    flex: 1,
  },
});
