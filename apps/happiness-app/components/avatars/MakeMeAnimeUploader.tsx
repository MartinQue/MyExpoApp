import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';

import { generateAnimeVRM } from '@/lib/avatars/animeGenerator';
import { useCustomAvatarStore } from '@/stores/customAvatarStore';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function MakeMeAnimeUploader() {
  const { status, error, clearError } = useCustomAvatarStore();
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const handlePickPhoto = useCallback(async () => {
    clearError();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
    }
  }, [clearError]);

  const handleGenerate = useCallback(async () => {
    if (!photoUri) return;

    try {
      await generateAnimeVRM({ photoUri });
    } catch (err) {
      console.error('Generate anime avatar failed:', err);
    }
  }, [photoUri]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Make Me Anime</Text>
      <Text style={styles.subtitle}>
        Upload a portrait photo and we’ll build a toon-style avatar. This uses a
        placeholder flow until the backend service is connected.
      </Text>

      <View style={styles.previewBox}>
        {photoUri ? (
          <Animated.Image
            source={{ uri: photoUri }}
            style={styles.preview}
            entering={FadeIn.duration(200)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No photo selected</Text>
            <Text style={styles.placeholderSubtext}>Tap below to choose one</Text>
          </View>
        )}
      </View>

      <AnimatedTouchable
        entering={FadeIn}
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={handlePickPhoto}
      >
        <Text style={styles.primaryButtonText}>
          {photoUri ? 'Choose another photo' : 'Select a photo'}
        </Text>
      </AnimatedTouchable>

      <AnimatedTouchable
        entering={FadeIn}
        style={[styles.secondaryButton, (!photoUri || status === 'generating' || status === 'uploading') && styles.disabledButton]}
        activeOpacity={0.85}
        onPress={handleGenerate}
        disabled={!photoUri || status === 'generating' || status === 'uploading'}
      >
        <Text style={styles.secondaryButtonText}>
          {status === 'uploading'
            ? 'Uploading…'
            : status === 'generating'
            ? 'Generating…'
            : 'Generate anime avatar'}
        </Text>
      </AnimatedTouchable>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {status === 'ready' ? (
        <Animated.View entering={FadeIn} style={styles.successBox}>
          <Text style={styles.successTitle}>Avatar added</Text>
          <Text style={styles.successSubtitle}>
            Your custom VRM is saved in the list and ready to use.
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
  },
  previewBox: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(12,12,16,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    gap: 4,
  },
  placeholderText: {
    color: '#fff',
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: 'rgba(255,255,255,0.6)',
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: '#F97316',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
  },
  successBox: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  successTitle: {
    color: '#4ADE80',
    fontWeight: '700',
  },
  successSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
});
