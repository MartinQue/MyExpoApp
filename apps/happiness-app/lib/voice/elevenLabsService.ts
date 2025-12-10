/**
 * ElevenLabs Text-to-Speech Service
 * Provides seamless, natural voice responses for AI conversations
 */

import { useState, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

// Optional ElevenLabs import - only available in development builds
let ElevenLabs: any = null;
let ElevenLabsAvailable = false;

try {
  const elevenLabsModule = require('@elevenlabs/react-native');
  ElevenLabs = elevenLabsModule.ElevenLabs;
  ElevenLabsAvailable = true;
} catch (error) {
  // Package not available (e.g., in Expo Go)
  // Will fall back to expo-speech
}

import { ELEVENLABS_API_KEY } from '@/constants/Config';
import { Logger } from '@/utils/Logger';
import { audioSessionManager } from '@/lib/audio/AudioSessionManager';

export interface VoiceSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface SpeakOptions {
  voiceId?: string;
  modelId?: string;
  voiceSettings?: VoiceSettings;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onAudioUrlReady?: (audioUrl: string) => void;
}

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';
const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.65,
  similarity_boost: 0.8,
  style: 0.6,
  use_speaker_boost: true,
};

class ElevenLabsService {
  private sound: Audio.Sound | null = null;
  private isInitialized = false;
  private isSpeaking = false;

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    // If ElevenLabs package is not available, use expo-speech fallback
    if (!ElevenLabsAvailable) {
      Logger.info('📢 ElevenLabs not available, using expo-speech fallback');
      this.isInitialized = true;
      return true;
    }

    if (!ELEVENLABS_API_KEY) {
      Logger.error('ElevenLabs API key missing; cannot initialize');
      return false;
    }

    try {
      ElevenLabs.configure({ apiKey: ELEVENLABS_API_KEY });
      // Use AudioSessionManager for consistent audio session handling
      await audioSessionManager.initialize();
      await audioSessionManager.setMode('playback');
      this.isInitialized = true;
      Logger.info('✅ ElevenLabs SDK configured');
      return true;
    } catch (error) {
      Logger.error('❌ Failed to initialize ElevenLabs SDK:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    // TTS is always available (expo-speech fallback), but ElevenLabs requires API key
    return ElevenLabsAvailable ? !!ELEVENLABS_API_KEY : true;
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<boolean> {
    if (!text?.trim()) return false;

    await this.stop();

    const ready = await this.initialize();
    if (!ready) {
      const error = new Error('Failed to initialize TTS service');
      options.onError?.(error);
      return false;
    }

    // Fallback to expo-speech if ElevenLabs is not available
    if (!ElevenLabsAvailable || !this.isConfigured()) {
      try {
        Logger.info('📢 Using expo-speech fallback');
        this.isSpeaking = true;
        options.onStart?.();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await Speech.speak(text, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9,
          onDone: () => {
            this.isSpeaking = false;
            options.onComplete?.();
          },
          onStopped: () => {
            this.isSpeaking = false;
          },
          onError: (error) => {
            this.isSpeaking = false;
            options.onError?.(new Error(String(error)));
          },
        });

        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        Logger.error('❌ expo-speech TTS failed:', err);
        this.isSpeaking = false;
        options.onError?.(err);
        return false;
      }
    }

    // Use ElevenLabs if available and configured
    try {
      const {
        voiceId = DEFAULT_VOICE_ID,
        modelId = DEFAULT_MODEL_ID,
        voiceSettings = DEFAULT_VOICE_SETTINGS,
        onStart,
        onComplete,
        onAudioUrlReady,
      } = options;

      const ttsOptions = {
        text,
        voiceId,
        modelId,
        voiceSettings,
        optimizeStreamingLatency: 4,
        outputFormat: 'mp3_44100_128',
      };

      Logger.info('🎤 Requesting ElevenLabs playback', ttsOptions);

      const response = await ElevenLabs.textToSpeech(ttsOptions);

      if (!response?.audioUrl) {
        throw new Error('ElevenLabs returned empty audioUrl');
      }

      // Call onAudioUrlReady callback for VRM lip sync
      onAudioUrlReady?.(response.audioUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: response.audioUrl },
        { shouldPlay: true },
        async (status) => {
          if (!status.isLoaded && status.error) {
            Logger.error('❌ ElevenLabs playback error:', status.error);
            this.isSpeaking = false;
            options.onError?.(new Error(String(status.error)));
          }

          if (status.isLoaded && status.didJustFinish) {
            Logger.info('✅ ElevenLabs playback completed');
            this.isSpeaking = false;
            await this.sound?.unloadAsync();
            this.sound = null;
            onComplete?.();
          }
        }
      );

      this.sound = sound;
      this.isSpeaking = true;

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStart?.();

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      Logger.error('❌ ElevenLabs TTS failed:', err);
      this.isSpeaking = false;
      options.onError?.(err);
      return false;
    }
  }

  async stop(): Promise<void> {
    // Stop expo-speech if using fallback
    if (!ElevenLabsAvailable || !this.sound) {
      Speech.stop();
      this.isSpeaking = false;
      await audioSessionManager.setMode('idle');
      return;
    }

    // Stop ElevenLabs audio
    if (!this.sound) return;

    try {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      this.isSpeaking = false;
      await audioSessionManager.setMode('idle');
      Logger.info('⏹️ ElevenLabs playback stopped');
    } catch (error) {
      Logger.error('Failed to stop ElevenLabs playback:', error);
      await audioSessionManager.setMode('idle');
    }
  }

  async pause(): Promise<void> {
    if (!this.sound || !this.isSpeaking) return;
    try {
      await this.sound.pauseAsync();
      Logger.info('⏸️ ElevenLabs playback paused');
    } catch (error) {
      Logger.error('Failed to pause ElevenLabs playback:', error);
    }
  }

  async resume(): Promise<void> {
    if (!this.sound) return;
    try {
      await this.sound.playAsync();
      Logger.info('▶️ ElevenLabs playback resumed');
    } catch (error) {
      Logger.error('Failed to resume ElevenLabs playback:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.stop();
    this.isInitialized = false;
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }
}

export const elevenLabsService = new ElevenLabsService();

export interface UseElevenLabsReturn {
  isSpeaking: boolean;
  isConfigured: boolean;
  error: string | null;
  speak: (text: string, options?: SpeakOptions) => Promise<boolean>;
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
}

export function useElevenLabs(): UseElevenLabsReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = elevenLabsService.isConfigured();

  useEffect(() => {
    // Initialize on mount
    elevenLabsService.initialize();

    // Cleanup on unmount
    return () => {
      elevenLabsService.cleanup();
    };
  }, []);

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      setError(null);

      const success = await elevenLabsService.speak(text, {
        ...options,
        onStart: () => {
          setIsSpeaking(true);
          options.onStart?.();
        },
        onComplete: () => {
          setIsSpeaking(false);
          options.onComplete?.();
        },
        onError: (err) => {
          setError(err.message);
          setIsSpeaking(false);
          options.onError?.(err);
        },
      });

      return success;
    },
    []
  );

  const stop = useCallback(async () => {
    await elevenLabsService.stop();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(async () => {
    await elevenLabsService.pause();
  }, []);

  const resume = useCallback(async () => {
    await elevenLabsService.resume();
  }, []);

  return {
    isSpeaking,
    isConfigured,
    error,
    speak,
    stop,
    pause,
    resume,
  };
}

export default elevenLabsService;
