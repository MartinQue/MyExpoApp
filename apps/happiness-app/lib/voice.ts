/**
 * Voice Recording and Transcription Service
 * Uses expo-av for recording and OpenAI Whisper for transcription
 */

import { Audio } from 'expo-av';
// Use legacy API to avoid deprecation warning
import * as FileSystem from 'expo-file-system/legacy';
import { OPENAI_API_KEY } from '@/constants/Config';
import * as Haptics from 'expo-haptics';
import {
  initializeTranscriptionProvider,
  getTranscriptionProvider,
} from './voice/transcriptionProvider';

// ========================================
// React Hook for Voice
// ========================================

import { useState, useCallback, useEffect } from 'react';

// ========================================
// Types
// ========================================

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  uri: string | null;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  language?: string;
  confidence?: number;
}

export interface VoiceServiceCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: (uri: string) => void;
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onError?: (error: Error) => void;
  onDurationUpdate?: (duration: number) => void;
  onMeteringUpdate?: (level: number) => void;
}

// ========================================
// Recording Configuration
// ========================================

const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
  isMeteringEnabled: true,
};

// ========================================
// Voice Service Class
// ========================================

class VoiceService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private callbacks: VoiceServiceCallbacks = {};
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private recordingStartTime: number = 0;

  constructor() {
    // Initialize transcription provider on service creation
    if (OPENAI_API_KEY) {
      initializeTranscriptionProvider(OPENAI_API_KEY);
    }
  }

  /**
   * Initialize audio session for recording
   */
  async initialize(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();

      if (status !== 'granted') {
        console.error('Audio permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  /**
   * Set callbacks for voice events
   */
  setCallbacks(callbacks: VoiceServiceCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<boolean> {
    try {
      // Stop any existing recording first
      if (this.recording) {
        await this.stopRecording();
      }

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        const error = new Error('Microphone permission not granted');
        console.error(error.message);
        this.callbacks.onError?.(error);
        return false;
      }

      // CRITICAL: Set audio mode IMMEDIATELY before creating recording
      // This is the fix for "Recording not allowed on iOS"
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Small delay to ensure audio mode is set (iOS quirk)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Create new recording with explicit options
      console.log('Creating recording with options:', RECORDING_OPTIONS);
      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS as Audio.RecordingOptions,
        (status) => {
          // Recording status callback for debugging
          if (status.isRecording) {
            const duration = Math.floor((status.durationMillis || 0) / 1000);
            this.callbacks.onDurationUpdate?.(duration);
            
            if (typeof status.metering === 'number') {
              this.callbacks.onMeteringUpdate?.(status.metering);
            }
          }
        },
        100 // Update interval in ms
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();

      // Start backup duration tracking (in case status callback doesn't work)
      this.durationInterval = setInterval(() => {
        const duration = Math.floor(
          (Date.now() - this.recordingStartTime) / 1000
        );
        this.callbacks.onDurationUpdate?.(duration);
      }, 100);

      this.callbacks.onRecordingStart?.();
      console.log('✅ Recording started successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to start recording:', error);

      // Try to reset audio mode on error
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (resetError) {
        console.error('Failed to reset audio mode:', resetError);
      }

      this.callbacks.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Stop recording and get the audio file URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      // Stop duration tracking
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Stop and unload recording
      await this.recording.stopAndUnloadAsync();

      const uri = this.recording.getURI();
      this.recording = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      if (uri) {
        this.callbacks.onRecordingStop?.(uri);
        console.log('Recording stopped, saved to:', uri);
      }

      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Cancel recording without saving
   */
  async cancelRecording(): Promise<void> {
    try {
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      console.log('Recording cancelled');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }

  /**
   * Transcribe audio file using configured provider (OpenAI Whisper or TheWhisper)
   */
  async transcribe(uri: string): Promise<TranscriptionResult | null> {
    // Try transcription provider first (supports TheWhisper with fallback)
    const provider = getTranscriptionProvider();
    if (provider) {
      try {
        this.callbacks.onTranscriptionStart?.();
        const result = await provider.transcribe(
          uri,
          {},
          async (fallbackUri) => {
            // Fallback to OpenAI Whisper implementation
            return this.transcribeWithOpenAIWhisper(fallbackUri);
          }
        );

        if (result) {
          this.callbacks.onTranscriptionComplete?.(result);
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          return result;
        }
      } catch (error) {
        console.warn(
          'Transcription provider failed, falling back to OpenAI Whisper:',
          error
        );
      }
    }

    // Fallback to OpenAI Whisper if provider not available or failed
    return this.transcribeWithOpenAIWhisper(uri);
  }

  /**
   * Transcribe audio file using OpenAI Whisper (internal implementation)
   */
  private async transcribeWithOpenAIWhisper(
    uri: string
  ): Promise<TranscriptionResult | null> {
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      this.callbacks.onError?.(new Error('OpenAI API key not configured'));
      return null;
    }

    try {
      this.callbacks.onTranscriptionStart?.();
      console.log('🎯 Starting transcription with OpenAI Whisper for:', uri);

      // Read the file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      console.log('📁 File info:', JSON.stringify(fileInfo, null, 2));

      // Determine file extension from URI
      const extension = uri.split('.').pop()?.toLowerCase() || 'm4a';
      const mimeType =
        extension === 'wav'
          ? 'audio/wav'
          : extension === 'mp3'
          ? 'audio/mpeg'
          : extension === 'webm'
          ? 'audio/webm'
          : 'audio/m4a';

      console.log('🎵 File extension:', extension, 'MIME type:', mimeType);

      // Create form data for the API request
      const formData = new FormData();

      // In React Native, FormData can accept file URIs directly
      // We need to create a file object that FormData can understand
      const file = {
        uri: uri,
        type: mimeType,
        name: `recording.${extension}`,
      } as any;

      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      // Don't specify language to allow auto-detection
      // formData.append('language', 'en');

      console.log('📤 Sending to Whisper API...');

      // Send to OpenAI Whisper API
      const transcriptionResponse = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('❌ Whisper API error response:', errorText);
        let errorMessage = 'Transcription failed';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await transcriptionResponse.json();
      console.log('✅ Whisper API response:', JSON.stringify(data, null, 2));

      const result: TranscriptionResult = {
        text: data.text || '',
        duration: data.duration || 0,
        language: data.language,
      };

      this.callbacks.onTranscriptionComplete?.(result);
      console.log('✅ Transcription complete:', result.text.slice(0, 100));

      // Haptic success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('❌ Transcription failed:', error);

      // Log transcription failures for debugging
      try {
        // Dynamic import for Logger (avoids circular dependencies)
        const LoggerModule = await import('../utils/Logger');
        LoggerModule.Logger.error('Voice transcription failed', {
          error: errorMessage,
          uri: uri.substring(0, 50) + '...',
        });
      } catch {
        // Logger not available, continue
        console.error('Voice transcription failed:', errorMessage);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Record and transcribe in one operation
   */
  async recordAndTranscribe(): Promise<TranscriptionResult | null> {
    const uri = await this.stopRecording();
    if (!uri) {
      return null;
    }

    return this.transcribe(uri);
  }

  /**
   * Play audio file
   */
  async playAudio(uri: string): Promise<void> {
    try {
      // Stop any existing playback
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      this.sound = sound;

      // Clean up when playback finishes
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          this.sound = null;
        }
      });
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Stop audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  /**
   * Get recording status
   */
  isRecording(): boolean {
    return this.recording !== null;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.cancelRecording();
    await this.stopPlayback();
  }
}

// ========================================
// Singleton Instance
// ========================================

export const voiceService = new VoiceService();

export interface UseVoiceReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  duration: number;
  error: string | null;
  transcript: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  clearTranscript: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  useEffect(() => {
    // Set up callbacks
    voiceService.setCallbacks({
      onRecordingStart: () => {
        setIsRecording(true);
        setDuration(0);
        setError(null);
      },
      onRecordingStop: () => {
        setIsRecording(false);
      },
      onTranscriptionStart: () => {
        setIsTranscribing(true);
      },
      onTranscriptionComplete: (result) => {
        setIsTranscribing(false);
        setTranscript(result.text);
      },
      onError: (err) => {
        setError(err.message);
        setIsRecording(false);
        setIsTranscribing(false);
      },
      onDurationUpdate: (dur) => {
        setDuration(dur);
      },
    });

    // Cleanup on unmount
    return () => {
      voiceService.cleanup();
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    await voiceService.startRecording();
  }, []);

  const stopRecording = useCallback(async () => {
    const uri = await voiceService.stopRecording();
    if (uri) {
      // Automatically transcribe
      await voiceService.transcribe(uri);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    await voiceService.cancelRecording();
    setIsRecording(false);
    setDuration(0);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    duration,
    error,
    transcript,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
  };
}

export default voiceService;
