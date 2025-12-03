/**
 * Epoch Service - Intelligent Context-Aware Conversations
 * Integration with https://github.com/ItzCrazyKns/Epoch
 * 
 * Provides time-of-day awareness, event context, and intelligent conversation starters
 */

import { OPENAI_API_KEY } from '@/constants/Config';
import { Logger } from '@/utils/Logger';

import { Config } from '@/constants/Config';

// Feature flag - enable/disable Epoch integration
const EPOCH_ENABLED = !!Config.epochApiUrl && !!Config.epochApiKey;
const EPOCH_API_URL = Config.epochApiUrl || '';
const EPOCH_API_KEY = Config.epochApiKey || '';

export interface EpochContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  date: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  userHistory?: {
    recentTopics: string[];
    mood?: string;
    energyLevel?: number;
  };
}

export interface EpochSuggestion {
  prompt: string;
  context: string;
  relevance: number;
  category: 'reflection' | 'action' | 'exploration' | 'support';
}

export interface EpochResponse {
  suggestions: EpochSuggestion[];
  contextualGreeting: string;
  sessionContext: string;
}

class EpochService {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = EPOCH_ENABLED && !!EPOCH_API_URL;
  }

  /**
   * Get context-aware conversation suggestions
   */
  async getConversationStarters(
    context: EpochContext
  ): Promise<EpochSuggestion[]> {
    if (!this.isEnabled) {
      // Fallback to local intelligent suggestions
      return this.getLocalSuggestions(context);
    }

    try {
      const response = await fetch(`${EPOCH_API_URL}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': EPOCH_API_KEY,
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        Logger.warn('Epoch API failed', {
          status: response.status,
          fallback: 'local suggestions',
        });
        console.warn('Epoch API failed, using local fallback');
        return this.getLocalSuggestions(context);
      }

      const data: EpochResponse = await response.json();
      return data.suggestions;
    } catch (error) {
      Logger.error('Epoch service error', {
        error: error instanceof Error ? error.message : String(error),
        fallback: 'local suggestions',
      });
      console.error('Epoch service error:', error);
      return this.getLocalSuggestions(context);
    }
  }

  /**
   * Get contextual greeting based on time, place, and user history
   */
  async getContextualGreeting(
    context: EpochContext,
    userName?: string
  ): Promise<string> {
    if (!this.isEnabled || !OPENAI_API_KEY) {
      return this.getLocalGreeting(context, userName);
    }

    try {
      // Use OpenAI to generate context-aware greeting
      const prompt = this.buildGreetingPrompt(context, userName);
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            temperature: 0.9,
            max_tokens: 100,
            messages: [
              {
                role: 'system',
                content:
                  'Generate a warm, personalized greeting (1-2 sentences) based on the context provided. Be natural and conversational.',
              },
              { role: 'user', content: prompt },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || this.getLocalGreeting(context, userName);
      }
    } catch (error) {
      console.error('Epoch greeting error:', error);
    }

    return this.getLocalGreeting(context, userName);
  }

  /**
   * Local fallback suggestions (intelligent but doesn't require Epoch API)
   */
  private getLocalSuggestions(context: EpochContext): EpochSuggestion[] {
    const suggestions: EpochSuggestion[] = [];

    // Time-based suggestions
    if (context.timeOfDay === 'morning') {
      suggestions.push({
        prompt: "What's one thing you want to accomplish today?",
        context: 'Morning motivation',
        relevance: 0.9,
        category: 'action',
      });
      suggestions.push({
        prompt: 'How are you feeling as you start this day?',
        context: 'Morning check-in',
        relevance: 0.85,
        category: 'reflection',
      });
    } else if (context.timeOfDay === 'evening') {
      suggestions.push({
        prompt: "What's one thing you're grateful for today?",
        context: 'Evening reflection',
        relevance: 0.9,
        category: 'reflection',
      });
      suggestions.push({
        prompt: 'How did today go? What stood out?',
        context: 'Evening review',
        relevance: 0.85,
        category: 'reflection',
      });
    }

    // Day-of-week suggestions
    if (context.dayOfWeek === 'Friday') {
      suggestions.push({
        prompt: "It's Friday! What are you looking forward to this weekend?",
        context: 'Weekend anticipation',
        relevance: 0.8,
        category: 'exploration',
      });
    } else if (context.dayOfWeek === 'Monday') {
      suggestions.push({
        prompt: 'New week ahead. What energy do you want to bring into it?',
        context: 'Week start',
        relevance: 0.85,
        category: 'action',
      });
    }

    // User history-based suggestions
    if (context.userHistory?.recentTopics.length) {
      const recentTopic = context.userHistory.recentTopics[0];
      suggestions.push({
        prompt: `How's ${recentTopic} going? Any updates?`,
        context: 'Follow-up on recent conversation',
        relevance: 0.95,
        category: 'support',
      });
    }

    return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  /**
   * Local fallback greeting
   */
  private getLocalGreeting(
    context: EpochContext,
    userName?: string
  ): string {
    const name = userName || 'friend';
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return `Good morning, ${name}! ☀️ Fresh day, fresh start. What's brewing in your mind?`;
    } else if (hour >= 12 && hour < 17) {
      return `Hey ${name}! 🌤️ Afternoon check-in - how's your day flowing?`;
    } else if (hour >= 17 && hour < 21) {
      return `Evening, ${name}! 🌅 Time to unwind. What do you want to talk through?`;
    }
    return `Hey ${name} 🌙 Still up? I'm here if you need to chat or process anything.`;
  }

  /**
   * Build prompt for AI-generated greeting
   */
  private buildGreetingPrompt(
    context: EpochContext,
    userName?: string
  ): string {
    return `Generate a personalized greeting for ${userName || 'the user'}.

Context:
- Time: ${context.timeOfDay} on ${context.dayOfWeek}
- Date: ${context.date}
${context.location ? `- Location: ${context.location.name || 'current location'}` : ''}
${context.userHistory?.mood ? `- Recent mood: ${context.userHistory.mood}` : ''}
${context.userHistory?.recentTopics.length ? `- Recent topics: ${context.userHistory.recentTopics.join(', ')}` : ''}

Make it warm, natural, and contextually relevant.`;
  }

  /**
   * Check if Epoch is enabled
   */
  isEpochEnabled(): boolean {
    return this.isEnabled;
  }
}

export const epochService = new EpochService();
export default epochService;

