import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import Live2DAvatar, { Live2DAvatarRef, Live2DExpression, Live2DModel } from './Live2DAvatar';
import SimpleAnimatedAvatar from './SimpleAnimatedAvatar';

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'surprised'
  | 'sad';

const STATE_TO_EXPRESSION: Record<AvatarState, Live2DExpression> = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
  happy: 'happy',
  surprised: 'surprised',
  sad: 'sad',
};

const USE_SIMPLE_AVATAR = false;

export interface AvatarControllerRef {
  playAudio: (audioUrl: string) => void;
}

interface AvatarControllerProps {
  model?: Live2DModel;
  state?: AvatarState;
  isSpeaking?: boolean;
  onReady?: () => void;
  onModelLoaded?: (modelName: string) => void;
  onError?: (error: string) => void;
  onTouched?: () => void;
  style?: any;
}

const AvatarController = forwardRef<AvatarControllerRef, AvatarControllerProps>(({
  model = 'hiyori',
  state = 'idle',
  isSpeaking = false,
  onReady,
  onModelLoaded,
  onError,
  onTouched,
  style
}, ref) => {
  const avatarRef = useRef<Live2DAvatarRef>(null);
  const currentStateRef = useRef<AvatarState>(state);
  const isSpeakingRef = useRef(isSpeaking);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    playAudio: (audioUrl: string) => {
      if (avatarRef.current) {
        avatarRef.current.playAudio(audioUrl);
      }
    }
  }), []);

  useEffect(() => {
    if (!avatarRef.current || !isReady) return;

    const expression = STATE_TO_EXPRESSION[state] || 'idle';
    avatarRef.current.setExpression(expression);
    currentStateRef.current = state;
  }, [state, isReady]);

  useEffect(() => {
    if (!avatarRef.current || !isReady) return;

    if (isSpeaking && !isSpeakingRef.current) {
      avatarRef.current.startLipSync();
      isSpeakingRef.current = true;
    } else if (!isSpeaking && isSpeakingRef.current) {
      avatarRef.current.stopLipSync();
      isSpeakingRef.current = false;
    }
  }, [isSpeaking, isReady]);

  useEffect(() => {
    if (!avatarRef.current || !isReady) return;
    avatarRef.current.loadModel(model);
  }, [model, isReady]);

  const handleReady = useCallback(() => {
    setIsReady(true);
    onReady?.();
  }, [onReady]);

  const handleModelLoaded = useCallback((modelName: string) => {
    onModelLoaded?.(modelName);
  }, [onModelLoaded]);

  const handleError = useCallback((error: string) => {
    onError?.(error);
  }, [onError]);

  const handleTouched = useCallback(() => {
    onTouched?.();
  }, [onTouched]);

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

  return (
    <View style={[styles.container, style]}>
      <Live2DAvatar
        ref={avatarRef}
        initialModel={model}
        initialExpression={STATE_TO_EXPRESSION[state]}
        onReady={handleReady}
        onModelLoaded={handleModelLoaded}
        onError={handleError}
        onTouched={handleTouched}
        style={styles.avatar}
      />
    </View>
  );
});

AvatarController.displayName = 'AvatarController';

export default AvatarController;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  avatar: {
    flex: 1,
  },
});
