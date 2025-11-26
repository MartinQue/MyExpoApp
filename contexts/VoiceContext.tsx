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
} from 'react';
import {
  startVoiceInput,
  stopVoiceInput,
  cancelVoiceInput,
  setVoiceCallbacks,
} from '@/components/chat/ChatHelpers';
import * as Haptics from 'expo-haptics';

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

  // Refs for cleanup
  const isInitialized = useRef(false);

  // Initialize voice callbacks once
  React.useEffect(() => {
    if (isInitialized.current) return;

    isInitialized.current = true;

    setVoiceCallbacks({
      onDurationUpdate: (dur) => {
        setDuration(dur);
      },
      onError: (err) => {
        console.error('🎤 Voice error in context:', err.message);
        setError(err.message);
        setIsListening(false);
        setIsTranscribing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
  }, []);

  // Actions
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setDuration(0);

      // Haptic feedback for start
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const started = await startVoiceInput();
      if (started) {
        setIsListening(true);
        console.log('🎤 VoiceContext: Recording started');
      } else {
        setError('Failed to start recording');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  const stopRecording = useCallback(async (): Promise<string> => {
    try {
      setIsListening(false);
      setIsTranscribing(true);

      // Haptic feedback for stop
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const transcription = await stopVoiceInput();
      setIsTranscribing(false);

      if (transcription && transcription.trim()) {
        setLastTranscription(transcription);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
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
    }
  }, []);

  const cancelRecording = useCallback(async (): Promise<void> => {
    try {
      setIsListening(false);
      setIsTranscribing(false);
      setDuration(0);
      await cancelVoiceInput();
      console.log('🎤 VoiceContext: Recording cancelled');
    } catch (err) {
      console.error('Error cancelling recording:', err);
    }
  }, []);

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
