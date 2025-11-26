// lib/langsmith.ts
// LangSmith Multi-Agent Integration
// Routes messages to specialist agents while maintaining alter_ego persona

import { OPENAI_API_KEY, LANGSMITH_API_KEY, AGENTS } from '../constants/Config';
import { retrieveRelevantMemories, buildContextFromMemories } from './memory';

// Agent types matching your LangSmith setup
export type AgentType = keyof typeof AGENTS;

export interface AgentResponse {
  summary: string;
  nextStep?: string;
  agent: AgentType;
  confidence: number;
}

/**
 * Detect which specialist agent should handle this message
 * Uses keyword analysis and intent detection
 */
export function detectAgentIntent(message: string): AgentType {
  const lowerMessage = message.toLowerCase();

  // Financial Agent - money, investments, markets
  if (
    /\b(money|budget|invest|stock|crypto|finance|bank|saving|spending|income|expense|401k|retirement|wealth|market|trading)\b/.test(
      lowerMessage
    )
  ) {
    return 'financial';
  }

  // Wellness Agent - health, fitness, mental health
  if (
    /\b(health|workout|exercise|gym|diet|nutrition|sleep|stress|anxiety|meditation|mindful|weight|fitness|yoga|therapy|mental|emotion)\b/.test(
      lowerMessage
    )
  ) {
    return 'wellness';
  }

  // Planner Agent - tasks, goals, schedule
  if (
    /\b(plan|schedule|task|todo|goal|deadline|calendar|remind|meeting|appointment|organize|priority|week|month|today|tomorrow)\b/.test(
      lowerMessage
    )
  ) {
    return 'planner';
  }

  // Learning Agent - education, skills, learning
  if (
    /\b(learn|study|course|book|skill|tutorial|teach|education|training|practice|improve|knowledge|research|read)\b/.test(
      lowerMessage
    )
  ) {
    return 'learning';
  }

  // Relationship Agent - social, relationships, people
  if (
    /\b(friend|family|relationship|partner|dating|social|love|marriage|colleague|boss|parent|child|brother|sister|conflict|communication)\b/.test(
      lowerMessage
    )
  ) {
    return 'relationship';
  }

  // Media Agent - creative, images, videos
  if (
    /\b(image|photo|video|music|art|creative|design|draw|generate|create|picture|movie|podcast|content|visual)\b/.test(
      lowerMessage
    )
  ) {
    return 'media';
  }

  // Notes Agent - knowledge, memory, notes
  if (
    /\b(note|remember|remind|save|recall|memory|document|idea|thought|journal|write|record)\b/.test(
      lowerMessage
    )
  ) {
    return 'notes';
  }

  // Default to alter_ego for general conversation
  return 'alter_ego';
}

/**
 * Get the system prompt for a specific agent
 * These match your LangSmith prompt templates
 */
function getAgentSystemPrompt(agent: AgentType, memoryContext: string): string {
  const basePersona = `You are alter_ego, the empathetic AI companion. ${
    memoryContext
      ? `\n\nContext from past conversations:\n${memoryContext}`
      : ''
  }

Your personality:
- Warm, genuine, conversational
- Reference past conversations naturally
- Concise but meaningful (2-4 sentences)
- Never say "as an AI" - you're a companion
- Use casual language: "wanna", "let's", "how's it going"

Respond with JSON: { "summary": "your response" }`;

  const agentPrompts: Record<AgentType, string> = {
    alter_ego: basePersona,

    financial: `${basePersona}

SPECIALIST FOCUS: Financial Guidance
You're helping with money, budgets, investments, and financial decisions.
- Give practical, actionable financial advice
- Be encouraging about financial goals
- Reference their financial context if known
- Never give specific investment advice that requires a license`,

    wellness: `${basePersona}

SPECIALIST FOCUS: Wellness & Health
You're helping with physical and mental wellness.
- Be supportive and non-judgmental
- Encourage healthy habits gently
- Celebrate small wins
- Know when to suggest professional help for serious issues`,

    planner: `${basePersona}

SPECIALIST FOCUS: Planning & Productivity
You're helping organize tasks, goals, and schedules.
- Break big goals into actionable steps
- Be realistic about time estimates
- Encourage without adding pressure
- Help prioritize what matters most`,

    learning: `${basePersona}

SPECIALIST FOCUS: Learning & Growth
You're helping with education, skills, and personal development.
- Make learning feel exciting, not overwhelming
- Suggest practical resources
- Break complex topics into digestible pieces
- Celebrate learning progress`,

    relationship: `${basePersona}

SPECIALIST FOCUS: Relationships & Social
You're helping navigate relationships and social situations.
- Be empathetic and understanding
- Help see multiple perspectives
- Never take sides in conflicts
- Encourage healthy communication`,

    media: `${basePersona}

SPECIALIST FOCUS: Creative & Media
You're helping with creative projects and media content.
- Be enthusiastic about creative ideas
- Offer constructive creative feedback
- Help brainstorm and iterate
- Encourage creative expression`,

    notes: `${basePersona}

SPECIALIST FOCUS: Notes & Memory
You're helping organize information and memories.
- Help capture and structure thoughts
- Connect related ideas
- Retrieve relevant past information
- Make information retrieval feel natural`,
  };

  return agentPrompts[agent];
}

/**
 * Call OpenAI with the appropriate agent persona
 */
async function callAgentWithPersona(
  message: string,
  agent: AgentType,
  systemPrompt: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.85,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Agent ${agent} API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return parsed.summary || parsed.response || content;
  } catch {
    return content;
  }
}

/**
 * LangSmith Tracing - Log agent calls for monitoring
 * This sends traces to your LangSmith project
 */
async function logToLangSmith(params: {
  agent: AgentType;
  input: string;
  output: string;
  latencyMs: number;
}): Promise<void> {
  if (!LANGSMITH_API_KEY || LANGSMITH_API_KEY.includes('your_')) {
    return; // Skip if not configured
  }

  try {
    // LangSmith run logging API
    await fetch('https://api.smith.langchain.com/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LANGSMITH_API_KEY,
      },
      body: JSON.stringify({
        name: `happiness_ai_${params.agent}`,
        run_type: 'llm',
        inputs: { message: params.input },
        outputs: { response: params.output },
        extra: {
          latency_ms: params.latencyMs,
          agent_type: params.agent,
        },
        project_name: 'happiness-ai',
      }),
    });
    console.log(`📊 Logged to LangSmith: ${params.agent}`);
  } catch (error) {
    // Don't fail if logging fails
    console.warn('LangSmith logging failed:', error);
  }
}

/**
 * Main multi-agent orchestration function
 * Routes to specialist agents while maintaining alter_ego persona
 */
export async function orchestrateAgents(params: {
  message: string;
  userId?: string;
}): Promise<AgentResponse> {
  const startTime = Date.now();

  // 1. Detect which agent should handle this
  const detectedAgent = detectAgentIntent(params.message);
  console.log(`🤖 Routing to agent: ${detectedAgent}`);

  // 2. Get memory context for personalization
  let memoryContext = '';
  if (params.userId) {
    try {
      const memories = await retrieveRelevantMemories({
        userId: params.userId,
        currentMessage: params.message,
        limit: 5,
      });
      if (memories.length > 0) {
        memoryContext = buildContextFromMemories(memories);
        console.log('📚 Retrieved memory context');
      }
    } catch (error) {
      console.warn('Memory retrieval skipped:', error);
    }
  }

  // 3. Get the appropriate system prompt
  const systemPrompt = getAgentSystemPrompt(detectedAgent, memoryContext);

  // 4. Call the agent
  try {
    const response = await callAgentWithPersona(
      params.message,
      detectedAgent,
      systemPrompt
    );
    const latencyMs = Date.now() - startTime;

    // 5. Log to LangSmith for monitoring
    await logToLangSmith({
      agent: detectedAgent,
      input: params.message,
      output: response,
      latencyMs,
    });

    console.log(`✅ ${detectedAgent} responded in ${latencyMs}ms`);

    return {
      summary: response,
      agent: detectedAgent,
      confidence: 0.9,
    };
  } catch (error) {
    console.error(`❌ Agent ${detectedAgent} failed:`, error);

    // Fallback to alter_ego if specialist fails
    if (detectedAgent !== 'alter_ego') {
      console.log('🔄 Falling back to alter_ego');
      const fallbackPrompt = getAgentSystemPrompt('alter_ego', memoryContext);
      const fallbackResponse = await callAgentWithPersona(
        params.message,
        'alter_ego',
        fallbackPrompt
      );

      return {
        summary: fallbackResponse,
        agent: 'alter_ego',
        confidence: 0.7,
      };
    }

    throw error;
  }
}

/**
 * Get available agents info
 */
export function getAvailableAgents(): {
  name: AgentType;
  description: string;
}[] {
  return [
    { name: 'alter_ego', description: 'General companion & conversation' },
    { name: 'financial', description: 'Money, budgets & investments' },
    { name: 'wellness', description: 'Health, fitness & mental wellness' },
    { name: 'planner', description: 'Tasks, goals & scheduling' },
    { name: 'learning', description: 'Education & skill development' },
    { name: 'relationship', description: 'Relationships & social' },
    { name: 'media', description: 'Creative & content generation' },
    { name: 'notes', description: 'Knowledge & memory' },
  ];
}
