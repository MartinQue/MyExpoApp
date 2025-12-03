/**
 * ChatHelpers.ts - Real AI Integration Service
 *
 * This module provides the chat functionality by connecting to
 * the multi-agent AI backend via lib/think.ts
 *
 * Routes messages to specialist agents:
 * - alter_ego: General conversation
 * - financial: Money & investments
 * - wellness: Health & fitness
 * - planner: Tasks & goals
 * - learning: Education & skills
 * - relationship: Social & relationships
 * - media: Creative & content
 * - notes: Knowledge & memory
 */

import { analyzeNote } from '@/lib/think';
import { AgentType, detectAgentIntent } from '@/lib/langsmith';
import { voiceService } from '@/lib/voice';

// ============================================================
// TYPES
// ============================================================

export interface ChatMessage {
  _id: number | string;
  text: string;
  createdAt: Date;
  user: {
    _id: number;
    name?: string;
    avatar?: string;
  };
  system?: boolean;
  isLoading?: boolean;
  error?: boolean;
  agent?: AgentType; // Which specialist agent handled this
  retryPrompt?: string; // Store original prompt for retry capability
}

export interface SendMessageOptions {
  userId?: string;
  systemPrompt?: string;
}

// ============================================================
// VOICE STATE (for tracking recording status)
// ============================================================

let isRecording = false;
let recordingStartTime: Date | null = null;

// ============================================================
// AI INTEGRATION
// ============================================================

/**
 * Send a message to the AI and get a real response
 * Uses lib/think.ts which connects to OpenAI (and optionally LangGraph)
 */
// Agent display names for UI
const AGENT_NAMES: Record<AgentType, string> = {
  alter_ego: 'Alter Ego',
  financial: 'Finance Guide',
  wellness: 'Wellness Coach',
  planner: 'Life Planner',
  learning: 'Learning Mentor',
  relationship: 'Relationship Advisor',
  media: 'Creative Studio',
  notes: 'Memory Keeper',
};

export const sendMessageToAI = async (
  text: string,
  options?: SendMessageOptions
): Promise<ChatMessage> => {
  if (!text.trim()) {
    throw new Error('Message cannot be empty');
  }

  // Detect which agent will handle this (for UI preview)
  const detectedAgent = detectAgentIntent(text);
  console.log(`🎯 Routing to: ${AGENT_NAMES[detectedAgent]}`);

  try {
    // Call the multi-agent AI system via lib/think.ts
    const response = await analyzeNote({
      noteId: `msg_${Date.now()}`,
      text: text.trim(),
      userId: options?.userId,
      systemPrompt: options?.systemPrompt,
    });

    // Extract the AI response and agent info
    // Note: Safety filtering is already applied in analyzeNote() via assessRisk()
    const aiResponseText =
      response.summary?.trim() ||
      response.nextStep?.trim() ||
      "I'm here and listening. What's on your mind?";

    const respondingAgent = response.agent || detectedAgent;

    return {
      _id: Date.now(),
      text: aiResponseText,
      createdAt: new Date(),
      user: {
        _id: 2,
        name: AGENT_NAMES[respondingAgent],
        avatar: undefined,
      },
      agent: respondingAgent,
    };
  } catch (error) {
    console.error('AI response error:', error);

    // Return a graceful error message
    return {
      _id: Date.now(),
      text: "I'm having a moment. Give me a second and try again.",
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'Alter Ego',
      },
      error: true,
      agent: 'alter_ego',
    };
  }
};

/**
 * Get the display name for an agent
 */
export const getAgentDisplayName = (agent: AgentType): string => {
  return AGENT_NAMES[agent] || 'Alter Ego';
};

/**
 * Get agent-specific color for UI
 */
export const getAgentColor = (agent: AgentType): string => {
  const colors: Record<AgentType, string> = {
    alter_ego: '#FFFFFF',
    financial: '#10B981', // Emerald
    wellness: '#F472B6', // Pink
    planner: '#60A5FA', // Blue
    learning: '#FBBF24', // Amber
    relationship: '#F87171', // Red
    media: '#A78BFA', // Purple
    notes: '#34D399', // Teal
  };
  return colors[agent] || '#FFFFFF';
};

// ============================================================
// VOICE INPUT - Real Implementation using lib/voice.ts
// ============================================================

// Voice state callbacks for external components
let voiceCallbacks: {
  onDurationUpdate?: (duration: number) => void;
  onMeteringUpdate?: (level: number) => void;
  onError?: (error: Error) => void;
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (text: string) => void;
} = {};

/**
 * Set voice callbacks for UI updates
 */
export const setVoiceCallbacks = (callbacks: typeof voiceCallbacks): void => {
  voiceCallbacks = callbacks;

  // Configure the voice service with our callbacks
  voiceService.setCallbacks({
    onRecordingStart: () => {
      isRecording = true;
      recordingStartTime = new Date();
      console.log('🎤 Voice recording started');
    },
    onRecordingStop: () => {
      console.log('🎤 Voice recording stopped');
    },
    onDurationUpdate: (duration) => {
      voiceCallbacks.onDurationUpdate?.(duration);
    },
    onMeteringUpdate: (level) => {
      voiceCallbacks.onMeteringUpdate?.(level);
    },
    onTranscriptionStart: () => {
      voiceCallbacks.onTranscriptionStart?.();
    },
    onTranscriptionComplete: (result) => {
      voiceCallbacks.onTranscriptionComplete?.(result.text);
    },
    onError: (error) => {
      console.error('🎤 Voice error:', error.message);
      voiceCallbacks.onError?.(error);
    },
  });
};

/**
 * Start voice recording using the real voice service
 */
export const startVoiceInput = async (): Promise<boolean> => {
  console.log('🎤 Starting voice input (real implementation)...');

  try {
    const started = await voiceService.startRecording();
    if (started) {
      isRecording = true;
      recordingStartTime = new Date();
      console.log('✅ Voice recording started successfully');
    } else {
      console.error('❌ Failed to start voice recording');
      voiceCallbacks.onError?.(new Error('Failed to start recording'));
    }
    return started;
  } catch (error) {
    console.error('❌ Error starting voice input:', error);
    voiceCallbacks.onError?.(error as Error);
    return false;
  }
};

/**
 * Stop voice recording and get transcription using real voice service
 */
export const stopVoiceInput = async (): Promise<string> => {
  console.log('🎤 Stopping voice input (real implementation)...');

  const duration = recordingStartTime
    ? (new Date().getTime() - recordingStartTime.getTime()) / 1000
    : 0;

  isRecording = false;
  recordingStartTime = null;

  // Check if recording is too short
  if (duration < 0.5) {
    console.log('⚠️ Recording too short, ignoring');
    await voiceService.stopRecording(); // Still stop recording
    return '';
  }

  try {
    // Stop recording and transcribe
    voiceCallbacks.onTranscriptionStart?.();
    const result = await voiceService.recordAndTranscribe();

    if (result && result.text) {
      console.log(
        `✅ Transcription (${duration.toFixed(1)}s): "${result.text}"`
      );
      voiceCallbacks.onTranscriptionComplete?.(result.text);
      return result.text;
    } else {
      console.log('⚠️ No transcription result');
      return '';
    }
  } catch (error) {
    console.error('❌ Error stopping voice input:', error);
    voiceCallbacks.onError?.(error as Error);
    return '';
  }
};

/**
 * Cancel current recording without transcription
 */
export const cancelVoiceInput = async (): Promise<void> => {
  console.log('🎤 Cancelling voice input...');
  isRecording = false;
  recordingStartTime = null;
  await voiceService.stopRecording();
};

/**
 * Check if currently recording
 */
export const isVoiceRecording = (): boolean => {
  return isRecording;
};

/**
 * Clean up voice resources
 */
export const cleanupVoice = (): void => {
  voiceService.cleanup();
  isRecording = false;
  recordingStartTime = null;
};

// ============================================================
// ATTACHMENTS (Placeholder - will be implemented in Phase 6)
// ============================================================

/**
 * Open attachment sheet
 * This is handled by the ChatInputBar modal now
 */
export const openAttachmentSheet = (): void => {
  console.log('📎 Opening attachment options...');
  // The modal is handled in ChatInputBar.tsx
  // This function is kept for backwards compatibility
};

/**
 * Handle camera capture
 * TODO: Implement with expo-camera in Phase 6
 */
export const capturePhoto = async (): Promise<string | null> => {
  console.log('📷 Camera capture - not yet implemented');
  return null;
};

/**
 * Handle photo library selection
 * TODO: Implement with expo-image-picker in Phase 6
 */
export const selectFromLibrary = async (): Promise<string | null> => {
  console.log('🖼️ Photo library - not yet implemented');
  return null;
};

/**
 * Handle document selection
 * TODO: Implement with expo-document-picker in Phase 6
 */
export const selectDocument = async (): Promise<string | null> => {
  console.log('📄 Document picker - not yet implemented');
  return null;
};
