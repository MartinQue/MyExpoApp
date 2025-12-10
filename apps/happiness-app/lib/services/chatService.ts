/**
 * ChatService - Unified Chat Service Layer
 * 
 * Provides a clean interface for chat operations:
 * - Sending messages
 * - Streaming responses (future)
 * - Error handling
 * - Agent routing
 * - Context injection (time, place, user profile)
 */

import { sendMessageToAI, ChatMessage, SendMessageOptions } from '@/components/chat/ChatHelpers';
import { AgentType } from '@/lib/langsmith';
import { Logger } from '@/utils/Logger';

export interface ChatServiceOptions extends SendMessageOptions {
  context?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      name?: string;
    };
    userProfile?: {
      name?: string;
      goals?: string[];
      preferences?: Record<string, any>;
    };
  };
}

export interface ChatServiceResponse {
  message: ChatMessage;
  agent: AgentType;
  latency?: number;
}

class ChatService {
  /**
   * Send a message to the AI with full context injection
   */
  async sendMessage(
    text: string,
    options?: ChatServiceOptions
  ): Promise<ChatServiceResponse> {
    const startTime = Date.now();

    try {
      // Build context-aware system prompt if context provided
      let systemPrompt = options?.systemPrompt;
      if (options?.context && !systemPrompt) {
        systemPrompt = this.buildContextualPrompt(options.context);
      }

      // Send message with context
      const message = await sendMessageToAI(text, {
        userId: options?.userId,
        systemPrompt,
      });

      const latency = Date.now() - startTime;

      Logger.info('Chat message sent', {
        agent: message.agent,
        latency,
        textLength: text.length,
      });

      return {
        message,
        agent: message.agent || 'alter_ego',
        latency,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      Logger.error('Chat service error', {
        error: errorMessage,
        text: text.substring(0, 100),
      });

      // Return graceful error message
      return {
        message: {
          _id: Date.now(),
          text: "I'm having a moment. Give me a second and try again.",
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Companion',
          },
          error: true,
          agent: 'alter_ego',
        },
        agent: 'alter_ego',
        latency: Date.now() - startTime,
      };
    }
  }

  /**
   * Build contextual system prompt from time, location, and user profile
   */
  private buildContextualPrompt(context: ChatServiceOptions['context']): string {
    if (!context) return '';

    const parts: string[] = [];

    if (context.timeOfDay) {
      parts.push(`Current time: ${context.timeOfDay}`);
    }

    if (context.dayOfWeek) {
      parts.push(`Day: ${context.dayOfWeek}`);
    }

    if (context.location?.name) {
      parts.push(`Location: ${context.location.name}`);
    }

    if (context.userProfile?.name) {
      parts.push(`User: ${context.userProfile.name}`);
    }

    if (context.userProfile?.goals && context.userProfile.goals.length > 0) {
      parts.push(`Active goals: ${context.userProfile.goals.join(', ')}`);
    }

    const base = parts.length > 0
      ? `Context: ${parts.join('. ')}. Use this context to personalize your response.`
      : '';

    const audiovisualGuidance = `
Presentation & voice directives:
- You are rendered as a Grok-style high-fidelity anime companion powered by Project Airi assets (full-body, expressive, idle + speaking/lip-sync states)
- Assume responses are spoken through IndexTTS by default; ElevenLabs is only a fallback to mention if troubleshooting
- Keep tone natural, emotionally rich, and aligned with that premium anime companion experience`;

    return base ? `${base}\n${audiovisualGuidance}` : audiovisualGuidance;
  }

  /**
   * Get conversation history for context (future: streaming support)
   */
  async getConversationHistory(userId?: string, limit: number = 10): Promise<ChatMessage[]> {
    // This would integrate with chatStore or Supabase
    // For now, return empty array
    return [];
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;






