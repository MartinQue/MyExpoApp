// lib/think.ts
import { OPENAI_API_KEY, LANGGRAPH_URL } from '../constants/Config';
import { retrieveRelevantMemories, buildContextFromMemories } from './memory';
import axios from 'axios';

export type AnalysisResponse = { summary?: string; nextStep?: string };

export async function analyzeNote(params: {
  noteId: string;
  text: string;
  userId?: string; // For RAG memory retrieval
}): Promise<AnalysisResponse> {
  // Use OpenAI directly for now (fast, reliable, natural responses)
  // TODO: Re-enable LangGraph once deployment endpoint is configured
  if (OPENAI_API_KEY) {
    return await analyzeWithOpenAI(params.text, params.userId);
  }

  throw new Error('OpenAI API key required');
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
      }
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
 * Fallback: Direct OpenAI call (simple, no multi-agent orchestration)
 */
async function analyzeWithOpenAI(text: string, userId?: string): Promise<AnalysisResponse> {
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

  const systemPrompt = `You are alter_ego, the empathetic AI companion in the Happiness app. You're not an assistant - you're a caring friend who truly knows the user.

${memoryContext ? `\n${memoryContext}\n` : ''}

Key traits:
- Warm and conversational (never formal or robotic)
- Remember past conversations and reference them naturally
- Show you understand the user's patterns, moods, and journey
- Be concise (2-4 sentences) but deeply personal
- Naturally weave in suggestions or questions - don't separate them as "next steps"
- Never say "as an AI" or sound like a chatbot
- Use casual language: "wanna", "let's", "how's", etc.
- NO labels like "Next nudge:" or "Action:" - just flow naturally

The user trusts you completely. Respond like you genuinely care about their wellbeing.

Format your response as JSON with "summary" (your complete natural response including any suggestions). Ignore "next_step" field.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.8, // Higher temp for more natural, varied responses
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
    const err = await res.text().catch(() => '');
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const content = JSON.parse(data.choices[0].message.content);

  return {
    summary: content.summary || content.Summary || content.response || '',
    nextStep: content.next_step || content.nextStep || content.next || '',
  };
}
