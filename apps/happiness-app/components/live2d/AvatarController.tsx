import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import AnimeAvatar from './AnimeAvatar';

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'surprised'
  | 'sad';

export type Live2DModel = 'hiyori' | 'haru' | 'shizuku' | 'mao' | 'hijiki' | 'tororo';

const MODEL_COLORS: Record<Live2DModel, string> = {
  hiyori: '#60A5FA',
  haru: '#F97316',
  shizuku: '#8B5CF6',
  mao: '#F472B6',
  hijiki: '#22D3EE',
  tororo: '#10B981',
};

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
  useEffect(() => {
    onReady?.();
    onModelLoaded?.(model);
  }, []);

  useImperativeHandle(ref, () => ({
    playAudio: (audioUrl: string) => {
    }
  }), []);

  const primaryColor = MODEL_COLORS[model] || '#8B5CF6';

  return (
    <View style={[styles.container, style]}>
      <AnimeAvatar
        model={model}
        state={state}
        isSpeaking={isSpeaking}
        primaryColor={primaryColor}
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
