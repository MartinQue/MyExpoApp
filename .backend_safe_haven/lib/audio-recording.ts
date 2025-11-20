/**
 * Audio Recording Module
 * Handles microphone recording, permissions, and audio management
 */

import { Audio } from 'expo-av';
import { Alert } from 'react-native';

export interface AudioRecording {
  duration: number;
  uri: string;
  mimeType: string;
}

let recording: Audio.Recording | null = null;

/**
 * Setup audio recording with proper permissions and configuration
 */
export async function setupAudioRecording() {
  try {
    // Request microphone permissions
    const { status } = await Audio.getPermissionsAsync();
    if (status !== 'granted') {
      await Audio.requestPermissionsAsync();
    }

    // Configure audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    console.log('Audio recording setup completed successfully');
  } catch (error) {
    console.error('Audio setup failed:', error);
    throw error;
  }
}

/**
 * Start a new audio recording session
 */
export async function startAudioRecording() {
  try {
    // Stop any existing recording
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
    }

    // Create new recording instance using Audio.Recording.createAsync
    const { recording: newRecording } = await Audio.Recording.createAsync({
      isMeteringEnabled: false,
      android: {
        extension: '.m4a',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.wav',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/wav',
        bitsPerSecond: 128000,
      },
    });

    recording = newRecording;
    await recording.startAsync();
    console.log('Audio recording started');

    return recording;
  } catch (error) {
    console.error('Failed to start recording:', error);
    throw error;
  }
}

/**
 * Stop recording and return audio data
 */
export async function stopAudioRecording(): Promise<AudioRecording | null> {
  try {
    if (!recording) {
      console.warn('No active recording to stop');
      return null;
    }

    // Stop recording
    await recording.stopAndUnloadAsync();

    // Get the recording URI and duration
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();

    console.log('Audio recording stopped:', { uri, duration: status.durationMillis });

    const result: AudioRecording = {
      duration: status.durationMillis || 0,
      uri: uri || '',
      mimeType: 'audio/m4a',
    };

    recording = null;
    return result;
  } catch (error) {
    console.error('Failed to stop recording:', error);
    throw error;
  }
}

/**
 * Cancel ongoing recording without returning data
 */
export async function cancelAudioRecording() {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync();
      recording = null;
      console.log('Audio recording cancelled');
    }
  } catch (error) {
    console.error('Failed to cancel recording:', error);
    throw error;
  }
}

/**
 * Get current recording duration (async)
 */
export async function getRecordingDuration(): Promise<number> {
  if (!recording) return 0;

  try {
    const status = await recording.getStatusAsync();
    return status.durationMillis || 0;
  } catch (error) {
    console.error('Failed to get recording duration:', error);
    return 0;
  }
}

/**
 * Check if recording is currently active
 */
export function isRecordingActive(): boolean {
  return recording !== null;
}
