/**
 * VoiceContext.tsx - Shared Voice State Context
 *
 * This context provides a shared voice recording state that syncs
 * across all screens (Ask, AlterEgo, etc.) so that the Speak button
 * state is consistent when swiping between tabs.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useEffect,
} from 'react';
import {
  startVoiceInput,
  stopVoiceInput,
  cancelVoiceInput,
  setVoiceCallbacks,
} from '@/components/chat/ChatHelpers';
import haptics from '@/lib/haptics';

// ============================================================
// Types
// ============================================================

interface VoiceContextType {
  // State
  isListening: boolean;
  isTranscribing: boolean;
  duration: number;
  error: string | null;
  lastTranscription: string | null;

  // Actions
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string>;
  cancelRecording: () => Promise<void>;
  clearError: () => void;
  clearTranscription: () => void;
}

interface VoiceProviderProps {
  children: ReactNode;
}

// ============================================================
// Context
// ============================================================

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function VoiceProvider({ children }: VoiceProviderProps) {
  // State
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastTranscription, setLastTranscription] = useState<string | null>(
    null
  );

  // Refs for cleanup and VAD
  const isInitialized = useRef(false);
  const silenceStartRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false);
  const durationRef = useRef(0);

  // Update durationRef whenever duration changes
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // VAD Configuration
  const SILENCE_THRESHOLD_DB = -45;
  const SILENCE_DURATION_MS = 1500;
  const MIN_RECORDING_DURATION_SEC = 1.5;

  // Actions defined before useEffect to be used inside
  const stopRecording = useCallback(async (): Promise<string> => {
    if (isStoppingRef.current) return '';
    isStoppingRef.current = true;

    try {
      setIsListening(false);
      setIsTranscribing(true);

      // Haptic feedback for stop
      await haptics.voiceStop();

      const transcription = await stopVoiceInput();
      setIsTranscribing(false);

      if (transcription && transcription.trim()) {
        setLastTranscription(transcription);
        await haptics.success();
        console.log('🎤 VoiceContext: Transcription received:', transcription);
      }

      return transcription;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error stopping recording';
      setError(errorMessage);
      setIsListening(false);
      setIsTranscribing(false);
      return '';
    } finally {
      isStoppingRef.current = false;
      silenceStartRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setDuration(0);
      silenceStartRef.current = null;
      isStoppingRef.current = false;

      // Haptic feedback for start
      await haptics.voiceStart();

      const started = await startVoiceInput();
      if (started) {
        setIsListening(true);
        console.log('🎤 VoiceContext: Recording started');
      } else {
        setError('Failed to start recording');
        await haptics.error();
      }
      return started;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error starting recording';
      setError(errorMessage);
      setIsListening(false);
      return false;
    }
  }, []);

  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      setIsListening(false);
      setIsTranscribing(false);
      setDuration(0);
      silenceStartRef.current = null;
      await cancelVoiceInput();
      console.log('🎤 VoiceContext: Recording cancelled');
    } catch (err) {
      console.error('Error cancelling recording:', err);
    }
  }, []);

  // Initialize voice callbacks once
  React.useEffect(() => {
    if (isInitialized.current) return;

    isInitialized.current = true;

    setVoiceCallbacks({
      onDurationUpdate: (dur) => {
        setDuration(dur);
      },
      onMeteringUpdate: (level) => {
        // Voice Activity Detection (VAD) Logic
        if (isStoppingRef.current) return;

        if (level < SILENCE_THRESHOLD_DB) {
          // Silence detected
          if (silenceStartRef.current === null) {
            silenceStartRef.current = Date.now();
          } else {
            const silenceDuration = Date.now() - silenceStartRef.current;
            // Check if silence exceeds threshold and recording is long enough
            if (
              silenceDuration > SILENCE_DURATION_MS &&
              durationRef.current > MIN_RECORDING_DURATION_SEC
            ) {
              console.log('🤫 Silence detected, auto-stopping recording...');
              stopRecording();
            }
          }
        } else {
          // Voice detected, reset silence timer
          silenceStartRef.current = null;
        }
      },
      onError: (err) => {
        console.error('🎤 Voice error in context:', err.message);
        setError(err.message);
        setIsListening(false);
        setIsTranscribing(false);
        haptics.error();
      },
      onTranscriptionStart: () => {
        setIsTranscribing(true);
      },
      onTranscriptionComplete: (text) => {
        setIsTranscribing(false);
        setLastTranscription(text);
      },
    });

    return () => {
      // Cleanup on unmount
      cancelVoiceInput();
    };
  }, [stopRecording]); // Only depend on stopRecording which is stable

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearTranscription = useCallback(() => {
    setLastTranscription(null);
  }, []);

  // Context value
  const value: VoiceContextType = {
    // State
    isListening,
    isTranscribing,
    duration,
    error,
    lastTranscription,

    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
    clearTranscription,
  };

  return (
    <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useVoiceContext(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoiceContext must be used within a VoiceProvider');
  }
  return context;
}

/**
 * Hook for components that need voice functionality
 * Returns undefined if not within a VoiceProvider (safe for conditional use)
 */
export function useVoiceContextSafe(): VoiceContextType | undefined {
  return useContext(VoiceContext);
}

export default VoiceContext;
