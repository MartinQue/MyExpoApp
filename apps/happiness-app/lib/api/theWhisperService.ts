/**
 * TheWhisper Service - Alternative Voice Transcription Provider
 * Integration with https://github.com/TheStageAI/TheWhisper
 * 
 * Provides an alternative to OpenAI Whisper for voice transcription
 * with potentially better accuracy or lower latency
 */

import { Config } from '@/constants/Config';
import { Logger } from '@/utils/Logger';

// Feature flag - enable/disable TheWhisper integration
const THEWHISPER_ENABLED = !!Config.theWhisperApiUrl && !!Config.theWhisperApiKey;

export interface TheWhisperTranscriptionResult {
  text: string;
  duration: number;
  language?: string;
  confidence?: number;
  segments?: {
    start: number;
    end: number;
    text: string;
  }[];
}

export interface TheWhisperTranscriptionRequest {
  audioUri: string;
  language?: string;
  prompt?: string; // Optional context prompt
}

class TheWhisperService {
  private isEnabled: boolean;
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.isEnabled = THEWHISPER_ENABLED;
    this.apiUrl = Config.theWhisperApiUrl || '';
    this.apiKey = Config.theWhisperApiKey || '';
    
    if (!this.isEnabled) {
      Logger.warn('TheWhisperService is disabled or API credentials not configured.');
    }
  }

  /**
   * Transcribe audio using TheWhisper API
   */
  async transcribe(
    request: TheWhisperTranscriptionRequest
  ): Promise<TheWhisperTranscriptionResult | null> {
    if (!this.isEnabled) {
      Logger.info('TheWhisperService disabled, falling back to OpenAI Whisper.');
      return null;
    }

    try {
      Logger.info('Sending audio to TheWhisper API for transcription.', {
        audioUri: request.audioUri,
      });

      // Read audio file
      const response = await fetch(request.audioUri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('audio', blob, 'audio.m4a');
      
      if (request.language) {
        formData.append('language', request.language);
      }
      
      if (request.prompt) {
        formData.append('prompt', request.prompt);
      }

      const transcriptionResponse = await fetch(`${this.apiUrl}/transcribe`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        throw new Error(
          `TheWhisper API error: ${transcriptionResponse.status} - ${errorText}`
        );
      }

      const data = await transcriptionResponse.json();
      Logger.info('Received transcription from TheWhisper API.', {
        textLength: data.text?.length || 0,
      });

      return {
        text: data.text || '',
        duration: data.duration || 0,
        language: data.language,
        confidence: data.confidence,
        segments: data.segments,
      };
    } catch (error) {
      Logger.error('Failed to transcribe with TheWhisper API.', { error });
      return null;
    }
  }

  /**
   * Check if TheWhisper is enabled
   */
  isTheWhisperEnabled(): boolean {
    return this.isEnabled;
  }
}

const theWhisperService = new TheWhisperService();
export default theWhisperService;






