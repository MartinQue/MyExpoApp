/**
 * Voice Transcription Provider Interface
 * 
 * Allows switching between different transcription providers:
 * - OpenAI Whisper (default)
 * - TheWhisper (alternative)
 * 
 * This enables A/B testing and provider fallback
 */

import { TranscriptionResult } from '../voice';
import theWhisperService from '../api/theWhisperService';
import { Logger } from '@/utils/Logger';

export type TranscriptionProvider = 'openai-whisper' | 'thewhisper' | 'auto';

export interface TranscriptionProviderInterface {
  transcribe(audioUri: string, options?: TranscriptionOptions): Promise<TranscriptionResult | null>;
  isAvailable(): boolean;
  getName(): string;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string; // Context prompt for better accuracy
}

/**
 * OpenAI Whisper Provider (default)
 */
class OpenAIWhisperProvider implements TranscriptionProviderInterface {
  private openaiApiKey: string;

  constructor(openaiApiKey: string) {
    this.openaiApiKey = openaiApiKey;
  }

  async transcribe(
    audioUri: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult | null> {
    if (!this.openaiApiKey) {
      Logger.warn('OpenAI API key not configured for transcription');
      return null;
    }

    // This will be called from voice.ts's transcribe method
    // For now, return null to indicate it should use the existing implementation
    return null;
  }

  isAvailable(): boolean {
    return !!this.openaiApiKey;
  }

  getName(): string {
    return 'OpenAI Whisper';
  }
}

/**
 * TheWhisper Provider (alternative)
 */
class TheWhisperProvider implements TranscriptionProviderInterface {
  async transcribe(
    audioUri: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult | null> {
    if (!theWhisperService.isTheWhisperEnabled()) {
      Logger.info('TheWhisper not enabled, falling back to OpenAI Whisper');
      return null;
    }

    try {
      const result = await theWhisperService.transcribe({
        audioUri,
        language: options?.language,
        prompt: options?.prompt,
      });

      if (!result) {
        return null;
      }

      return {
        text: result.text,
        duration: result.duration,
        language: result.language,
        confidence: result.confidence,
      };
    } catch (error) {
      Logger.error('TheWhisper transcription failed', { error });
      return null;
    }
  }

  isAvailable(): boolean {
    return theWhisperService.isTheWhisperEnabled();
  }

  getName(): string {
    return 'TheWhisper';
  }
}

/**
 * Transcription Provider Manager
 * Handles provider selection and fallback
 */
class TranscriptionProviderManager {
  private providers: Map<TranscriptionProvider, TranscriptionProviderInterface>;
  private currentProvider: TranscriptionProvider;

  constructor(openaiApiKey: string) {
    this.providers = new Map();
    this.providers.set('openai-whisper', new OpenAIWhisperProvider(openaiApiKey));
    this.providers.set('thewhisper', new TheWhisperProvider());
    
    // Auto mode: try TheWhisper first if available, fallback to OpenAI Whisper
    this.currentProvider = 'auto';
  }

  /**
   * Set the active transcription provider
   */
  setProvider(provider: TranscriptionProvider): void {
    this.currentProvider = provider;
    Logger.info(`Transcription provider set to: ${provider}`);
  }

  /**
   * Get the active provider
   */
  getProvider(): TranscriptionProvider {
    return this.currentProvider;
  }

  /**
   * Transcribe audio using the configured provider (with fallback)
   */
  async transcribe(
    audioUri: string,
    options?: TranscriptionOptions,
    fallbackTranscribe?: (uri: string) => Promise<TranscriptionResult | null>
  ): Promise<TranscriptionResult | null> {
    if (this.currentProvider === 'auto') {
      // Try TheWhisper first if available
      const theWhisper = this.providers.get('thewhisper');
      if (theWhisper?.isAvailable()) {
        Logger.info('Auto mode: Trying TheWhisper first');
        const result = await theWhisper.transcribe(audioUri, options);
        if (result) {
          return result;
        }
        Logger.info('TheWhisper failed, falling back to OpenAI Whisper');
      }
      
      // Fallback to OpenAI Whisper
      if (fallbackTranscribe) {
        return fallbackTranscribe(audioUri);
      }
      return null;
    }

    const provider = this.providers.get(this.currentProvider);
    if (!provider || !provider.isAvailable()) {
      Logger.warn(
        `Provider ${this.currentProvider} not available, using fallback`
      );
      if (fallbackTranscribe) {
        return fallbackTranscribe(audioUri);
      }
      return null;
    }

    const result = await provider.transcribe(audioUri, options);
    if (!result && fallbackTranscribe) {
      Logger.info(`Provider ${this.currentProvider} failed, using fallback`);
      return fallbackTranscribe(audioUri);
    }

    return result;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): TranscriptionProvider[] {
    const available: TranscriptionProvider[] = [];
    
    this.providers.forEach((provider, name) => {
      if (provider.isAvailable()) {
        available.push(name as TranscriptionProvider);
      }
    });
    
    return available;
  }
}

// Export singleton instance
let providerManager: TranscriptionProviderManager | null = null;

export function initializeTranscriptionProvider(openaiApiKey: string): TranscriptionProviderManager {
  if (!providerManager) {
    providerManager = new TranscriptionProviderManager(openaiApiKey);
  }
  return providerManager;
}

export function getTranscriptionProvider(): TranscriptionProviderManager | null {
  return providerManager;
}

export default TranscriptionProviderManager;






