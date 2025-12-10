/**
 * AudioSessionManager - Unified Audio Session Coordination
 *
 * Prevents conflicts between multiple audio operations:
 * - Voice recording (expo-av)
 * - ElevenLabs playback (expo-av)
 * - LiveKit WebRTC (optional)
 *
 * Ensures proper audio session lifecycle and prevents iOS OSStatus errors
 */

import { Audio } from 'expo-av';
import { Logger } from '@/utils/Logger';

type AudioMode = 'idle' | 'recording' | 'playback' | 'livekit';

class AudioSessionManager {
  private currentMode: AudioMode = 'idle';
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize audio session manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        // Request permissions first
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Microphone permission not granted');
        }

        // Set initial idle state
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        this.isInitialized = true;
        this.currentMode = 'idle';
        Logger.info('✅ AudioSessionManager initialized');
      } catch (error) {
        Logger.error('❌ AudioSessionManager initialization failed:', error);
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Set audio session mode
   * Resets current mode first to prevent conflicts
   */
  async setMode(mode: AudioMode): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // If already in the desired mode, skip
    if (this.currentMode === mode && mode !== 'idle') {
      return;
    }

    try {
      // Always reset to idle first to clear any conflicts
      if (this.currentMode !== 'idle') {
        Logger.debug(
          `🔄 Resetting audio mode from ${this.currentMode} to idle`
        );
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        // Small delay to ensure reset completes
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Set new mode
      if (mode === 'recording') {
        Logger.debug('🎤 Setting audio mode to recording');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else if (mode === 'playback') {
        Logger.debug('🔊 Setting audio mode to playback');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else if (mode === 'idle') {
        Logger.debug('⏸️ Setting audio mode to idle');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      }

      // Additional delay to ensure mode is set (iOS quirk)
      await new Promise((resolve) => setTimeout(resolve, 150));

      this.currentMode = mode;
      Logger.debug(`✅ Audio mode set to ${mode}`);
    } catch (error) {
      Logger.error(`❌ Failed to set audio mode to ${mode}:`, error);
      throw error;
    }
  }

  /**
   * Get current audio mode
   */
  getCurrentMode(): AudioMode {
    return this.currentMode;
  }

  /**
   * Reset to idle mode
   */
  async reset(): Promise<void> {
    await this.setMode('idle');
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    try {
      await this.reset();
      this.isInitialized = false;
      Logger.info('🧹 AudioSessionManager cleaned up');
    } catch (error) {
      Logger.error('Error cleaning up AudioSessionManager:', error);
    }
  }
}

// Singleton instance
export const audioSessionManager = new AudioSessionManager();



