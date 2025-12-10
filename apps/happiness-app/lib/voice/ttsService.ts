import * as Speech from 'expo-speech';
import { elevenLabsService } from './elevenLabsService';
import { Logger } from '@/utils/Logger';
import { useState, useCallback } from 'react';

export interface TTSOptions {
  voiceId?: string;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

class TTSService {
  private isSpeaking = false;
  private currentProvider: 'elevenlabs' | 'expo-speech' | null = null;

  async speak(text: string, options: TTSOptions = {}): Promise<boolean> {
    if (!text?.trim()) return false;

    await this.stop();

    if (elevenLabsService.isConfigured()) {
      const success = await this.speakWithElevenLabs(text, options);
      if (success) return true;
      Logger.info('📢 ElevenLabs failed, falling back to expo-speech');
    }

    return this.speakWithExpoSpeech(text, options);
  }

  private async speakWithElevenLabs(
    text: string,
    options: TTSOptions
  ): Promise<boolean> {
    try {
      this.currentProvider = 'elevenlabs';
      this.isSpeaking = true;

      const success = await elevenLabsService.speak(text, {
        voiceId: options.voiceId,
        onStart: options.onStart,
        onComplete: () => {
          this.isSpeaking = false;
          this.currentProvider = null;
          options.onComplete?.();
        },
        onError: (error) => {
          this.isSpeaking = false;
          this.currentProvider = null;
          Logger.error('ElevenLabs TTS error:', error);
          options.onError?.(error);
        },
      });

      if (!success) {
        Logger.warn('ElevenLabs returned no audio, will fallback');
        this.isSpeaking = false;
        this.currentProvider = null;
      }

      return success;
    } catch (error) {
      Logger.error('ElevenLabs TTS failed:', error);
      this.isSpeaking = false;
      this.currentProvider = null;
      return false;
    }
  }

  private async speakWithExpoSpeech(
    text: string,
    options: TTSOptions
  ): Promise<boolean> {
    try {
      this.currentProvider = 'expo-speech';
      this.isSpeaking = true;

      options.onStart?.();

      await Speech.stop();
      Speech.speak(text, {
        rate: 0.9,
        pitch: 1.0,
        onDone: () => {
          this.isSpeaking = false;
          this.currentProvider = null;
          options.onComplete?.();
        },
        onStopped: () => {
          this.isSpeaking = false;
          this.currentProvider = null;
        },
        onError: (error) => {
          const err =
            error instanceof Error ? error : new Error(String(error ?? ''));
          Logger.error('expo-speech TTS error:', err);
          this.isSpeaking = false;
          this.currentProvider = null;
          options.onError?.(err);
        },
      });

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      Logger.error('expo-speech TTS failed:', err);
      this.isSpeaking = false;
      this.currentProvider = null;
      options.onError?.(err);
      return false;
    }
  }


  async stop(): Promise<void> {
    if (this.currentProvider === 'elevenlabs') {
      await elevenLabsService.stop();
    } else if (this.currentProvider === 'expo-speech') {
      Speech.stop();
    }
    this.isSpeaking = false;
    this.currentProvider = null;
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  getCurrentProvider(): string | null {
    return this.currentProvider;
  }

  isElevenLabsAvailable(): boolean {
    return elevenLabsService.isConfigured();
  }
}

export const ttsService = new TTSService();

export interface UseTTSReturn {
  isSpeaking: boolean;
  speak: (text: string, options?: TTSOptions) => Promise<boolean>;
  stop: () => Promise<void>;
  provider: string | null;
  isElevenLabsAvailable: boolean;
}

export function useTTS(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    const success = await ttsService.speak(text, {
      ...options,
      onStart: () => {
        setIsSpeaking(true);
        setProvider(ttsService.getCurrentProvider());
        options.onStart?.();
      },
      onComplete: () => {
        setIsSpeaking(false);
        setProvider(null);
        options.onComplete?.();
      },
      onError: (error) => {
        setIsSpeaking(false);
        setProvider(null);
        options.onError?.(error);
      },
    });
    return success;
  }, []);

  const stop = useCallback(async () => {
    await ttsService.stop();
    setIsSpeaking(false);
    setProvider(null);
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    provider,
    isElevenLabsAvailable: ttsService.isElevenLabsAvailable(),
  };
}

export default ttsService;
