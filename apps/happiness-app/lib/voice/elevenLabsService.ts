/**
 * ElevenLabs Text-to-Speech Service
 * Provides seamless, natural voice responses for AI conversations
 */

import { Audio } from 'expo-av';
import { ELEVENLABS_API_KEY } from '@/constants/Config';
import * as Haptics from 'expo-haptics';
import { Logger } from '@/utils/Logger';

// ========================================
// React Hook for ElevenLabs TTS
// ========================================

import { useState, useCallback, useEffect } from 'react';

// ========================================
// Types
// ========================================

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
}

// ========================================
// Default Configuration
// ========================================

const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - Soft & Natural
const DEFAULT_MODEL_ID = 'eleven_turbo_v2_5'; // Fastest model

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

// ========================================
// ElevenLabs Service Class
// ========================================

class ElevenLabsService {
  private sound: Audio.Sound | null = null;
  private isInitialized: boolean = false;
  private isSpeaking: boolean = false;

  /**
   * Initialize audio session for playback
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      Logger.info('✅ ElevenLabs service initialized');
      return true;
    } catch (error) {
      Logger.error('❌ Failed to initialize ElevenLabs service:', error);
      return false;
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!ELEVENLABS_API_KEY;
  }

  /**
   * Convert text to speech and play immediately
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<boolean> {
    if (!this.isConfigured()) {
      const error = new Error('ElevenLabs API key not configured');
      Logger.error(error.message);
      options.onError?.(error);
      return false;
    }

    // Stop any current playback
    await this.stop();

    try {
      // Initialize if needed
      await this.initialize();

      const {
        voiceId = DEFAULT_VOICE_ID,
        modelId = DEFAULT_MODEL_ID,
        voiceSettings = DEFAULT_VOICE_SETTINGS,
        onStart,
        onComplete,
      } = options;

      Logger.info('🎤 Generating speech for: ' + text.substring(0, 50) + '...');
      Logger.debug('📍 Voice ID:', voiceId);
      Logger.debug('🔑 API Key present:', !!ELEVENLABS_API_KEY);

      // Use fetch API to get audio from ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: voiceSettings,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ElevenLabs API error: ${response.status} - ${errorText}`
        );
      }

      // Convert response to blob and create data URI
      const audioBlob = await response.blob();
      const reader = new FileReader();

      const audioUri = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read audio data'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(audioBlob);
      });

      Logger.info('🔊 Playing audio...');

      // Play audio immediately
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate.bind(this, onComplete)
      );

      this.sound = sound;
      this.isSpeaking = true;

      // Haptic feedback on start
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onStart?.();

      Logger.info('✅ Speech started successfully');
      return true;
    } catch (error) {
      Logger.error('❌ Speech generation failed:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
      this.isSpeaking = false;
      return false;
    }
  }

  /**
   * Playback status update handler
   */
  private onPlaybackStatusUpdate(
    onComplete: (() => void) | undefined,
    status: any
  ): void {
    if (status.isLoaded && status.didJustFinish) {
      Logger.info('✅ Speech completed');
      this.isSpeaking = false;
      this.sound?.unloadAsync();
      this.sound = null;
      onComplete?.();
    }

    if (status.error) {
      Logger.error('❌ Playback error:', status.error);
      this.isSpeaking = false;
    }
  }

  /**
   * Stop current speech playback
   */
  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isSpeaking = false;
        Logger.info('⏹️ Speech stopped');
      } catch (error) {
        Logger.error('Failed to stop speech:', error);
      }
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  /**
   * Pause current playback
   */
  async pause(): Promise<void> {
    if (this.sound && this.isSpeaking) {
      try {
        await this.sound.pauseAsync();
        Logger.info('⏸️ Speech paused');
      } catch (error) {
        Logger.error('Failed to pause speech:', error);
      }
    }
  }

  /**
   * Resume paused playback
   */
  async resume(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.playAsync();
        Logger.info('▶️ Speech resumed');
      } catch (error) {
        Logger.error('Failed to resume speech:', error);
      }
    }
  }

  /**
   * Get playback position in milliseconds
   */
  async getPosition(): Promise<number> {
    if (this.sound) {
      try {
        const status = await this.sound.getStatusAsync();
        if (status.isLoaded) {
          return status.positionMillis;
        }
      } catch (error) {
        Logger.error('Failed to get playback position:', error);
      }
    }
    return 0;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.stop();
    this.isInitialized = false;
  }
}

// ========================================
// Singleton Instance
// ========================================

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
