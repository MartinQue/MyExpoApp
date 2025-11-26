// lib/think.ts
// AI Integration Layer - Connects to Multi-Agent System
// Routes through specialist agents while maintaining alter_ego persona

import {
  OPENAI_API_KEY,
  LANGGRAPH_URL,
  LANGSMITH_API_KEY,
} from '../constants/Config';
import { retrieveRelevantMemories, buildContextFromMemories } from './memory';
import { orchestrateAgents, detectAgentIntent, AgentType } from './langsmith';

export type AnalysisResponse = {
  summary?: string;
  nextStep?: string;
  error?: string;
  agent?: AgentType; // Which specialist agent handled the request
};

// Validate API key format
const isValidApiKey = (key: string | undefined): boolean => {
  return Boolean(key && key.length > 20 && key.startsWith('sk-'));
};

/**
 * Main AI analysis function
 * Sends user message to AI and returns response
 */
export async function analyzeNote(params: {
  noteId: string;
  text: string;
  userId?: string; // For RAG memory retrieval
  systemPrompt?: string; // Custom system prompt for avatar personas
}): Promise<AnalysisResponse> {
  // Validate input
  if (!params.text?.trim()) {
    return {
      summary: "I didn't catch that. What's on your mind?",
      error: 'Empty input',
    };
  }

  // Check for valid API key
  if (!OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not configured');
    return {
      summary:
        "I'm not fully connected yet. Please check the API configuration.",
      error: 'Missing API key',
    };
  }

  if (!isValidApiKey(OPENAI_API_KEY)) {
    console.error(
      '❌ OpenAI API key appears invalid:',
      OPENAI_API_KEY?.substring(0, 10) + '...'
    );
    return {
      summary:
        "There's something off with my connection. Let me know if this keeps happening.",
      error: 'Invalid API key format',
    };
  }

  // Priority 1: Use LangGraph Cloud if configured (full agent orchestration)
  if (LANGGRAPH_URL && !LANGGRAPH_URL.includes('your_langgraph')) {
    try {
      return await analyzeWithLangGraph(
        params.noteId,
        params.text,
        params.userId
      );
    } catch (error) {
      console.warn('LangGraph Cloud failed, trying local agents:', error);
    }
  }

  // Priority 2: Use local multi-agent orchestration (with LangSmith logging)
  try {
    console.log('🎯 Using multi-agent orchestration...');
    const result = await orchestrateAgents({
      message: params.text,
      userId: params.userId,
    });

    return {
      summary: result.summary,
      agent: result.agent,
    };
  } catch (agentError) {
    console.warn(
      'Multi-agent orchestration failed, using direct OpenAI:',
      agentError
    );
  }

  // Priority 3: Direct OpenAI fallback
  return await analyzeWithOpenAI(
    params.text,
    params.userId,
    params.systemPrompt
  );
}

/**
 * Use LangGraph multi-agent system (preferred)
 * This orchestrates alter_ego with specialist agents (planner, wellness, safety)
 */
async function analyzeWithLangGraph(
  noteId: string,
  text: string,
  userId?: string
): Promise<AnalysisResponse> {
  // RAG: Retrieve relevant memories for context
  let memoryContext = '';
  if (userId) {
    try {
      const memories = await retrieveRelevantMemories({
        userId,
        currentMessage: text,
        limit: 5,
      });
      if (memories.length > 0) {
        memoryContext = buildContextFromMemories(memories);
      }
    } catch (error) {
      console.error('Memory retrieval failed:', error);
      // Continue without memory context
    }
  }

  const url = LANGGRAPH_URL;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add LangChain API key for authentication if available
  // Disabled for now - using direct OpenAI integration

  const res = await fetch(`${url}/invoke`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: {
        noteId: noteId,
        text: text,
        userId: userId,
        memories: memoryContext, // Pass RAG context to agents
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`LangGraph API error ${res.status}: ${err}`);
  }

  const data = await res.json().catch(() => ({}));

  // LangGraph returns the final state after agent processing
  const summary = data?.output?.summary ?? data?.summary ?? '';
  const nextStep = data?.output?.nextStep ?? data?.nextStep ?? '';

  return { summary, nextStep };
}

/**
 * Direct OpenAI Integration
 * Fast, reliable, natural responses with alter_ego persona
 */
async function analyzeWithOpenAI(
  text: string,
  userId?: string,
  customSystemPrompt?: string
): Promise<AnalysisResponse> {
  // RAG: Retrieve relevant memories for context
  let memoryContext = '';
  if (userId) {
    try {
      const memories = await retrieveRelevantMemories({
        userId,
        currentMessage: text,
        limit: 5,
      });
      if (memories.length > 0) {
        memoryContext = buildContextFromMemories(memories);
        console.log('📚 Retrieved memory context for conversation');
      }
    } catch (error) {
      console.warn('Memory retrieval skipped:', error);
      // Continue without memory context - not critical
    }
  }

  const defaultSystemPrompt = `You are alter_ego, the empathetic AI companion in the Happiness app. You're not an assistant - you're a caring friend who truly knows the user.

${memoryContext ? `\nContext from past conversations:\n${memoryContext}\n` : ''}

Your personality:
- Warm, genuine, conversational (never formal or robotic)
- Reference past conversations naturally when relevant
- Show deep understanding of the user's patterns, moods, and journey
- Concise but meaningful (2-4 sentences typically)
- Naturally weave in gentle suggestions or thoughtful questions
- Never say "as an AI" - you're a companion, not a tool
- Use casual language: "wanna", "let's", "how's it going", etc.
- Match the user's energy - if they're excited, be excited; if they're down, be supportive

Conversation style:
- Start with acknowledgment of what they said
- Add your insight or response
- End with a natural continuation (question, suggestion, or affirmation)
- NO labels, NO bullet points, NO structured outputs - just natural speech

The user trusts you completely. Respond like you genuinely care.

Respond with JSON: { "summary": "your natural response here" }`;

  // Use custom prompt if provided, otherwise use default
  const systemPrompt = customSystemPrompt
    ? `${customSystemPrompt}

${memoryContext ? `\nContext from past conversations:\n${memoryContext}\n` : ''}

Respond naturally and conversationally. Keep responses 2-4 sentences typically.
Respond with JSON: { "summary": "your natural response here" }`
    : defaultSystemPrompt;

  try {
    console.log('🤖 Sending to OpenAI...');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.85,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      console.error(`❌ OpenAI API error ${res.status}:`, errorText);

      // Handle specific error codes
      if (res.status === 401) {
        return {
          summary:
            'My connection seems to be having issues. Can you check back in a moment?',
          error: 'Invalid API key',
        };
      }
      if (res.status === 429) {
        return {
          summary:
            "I'm a bit overwhelmed right now. Give me a second to catch my breath.",
          error: 'Rate limited',
        };
      }
      if (res.status === 500 || res.status === 503) {
        return {
          summary:
            "Something's happening on my end. Let's try that again in a sec.",
          error: 'Server error',
        };
      }

      return {
        summary: 'I had a hiccup there. Mind trying that again?',
        error: `API error ${res.status}`,
      };
    }

    const data = await res.json();

    if (!data.choices?.[0]?.message?.content) {
      console.error('❌ Unexpected API response structure:', data);
      return {
        summary:
          "I'm here, but something got lost in translation. What were you saying?",
        error: 'Invalid response structure',
      };
    }

    // Parse the JSON response
    let content;
    try {
      content = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, use the raw content
      console.warn('JSON parse failed, using raw content');
      content = { summary: data.choices[0].message.content };
    }

    const responseText =
      content.summary ||
      content.Summary ||
      content.response ||
      content.message ||
      '';

    if (!responseText) {
      return {
        summary: "I'm listening. Tell me more about what's on your mind.",
        error: 'Empty response',
      };
    }

    console.log('✅ AI response received');
    return {
      summary: responseText,
      nextStep: content.next_step || content.nextStep || '',
    };
  } catch (error) {
    console.error('❌ OpenAI request failed:', error);

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        summary:
          "I'm having trouble connecting. Check your internet and we'll try again.",
        error: 'Network error',
      };
    }

    return {
      summary: "Something went sideways there. Let's try that again.",
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
