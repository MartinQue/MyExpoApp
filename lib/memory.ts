/**
 * Memory System with RAG (Retrieval Augmented Generation)
 * Uses OpenAI embeddings and Supabase vector search for semantic memory retrieval
 */

import { supabase } from './supabase';
import { OPENAI_API_KEY } from '@/constants/Config';

// ========================================
// Types
// ========================================

export interface Memory {
  id: string;
  content: string;
  createdAt: string;
  sentiment?: string;
  topic?: string;
  similarity?: number;
}

export interface MemorySearchResult {
  memories: Memory[];
  contextSummary: string;
}

// ========================================
// OpenAI Embedding Generation
// ========================================

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embeddings using OpenAI's text-embedding-3-small model
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000), // Max input length
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Embedding API error:', error);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

// ========================================
// Memory Storage
// ========================================

/**
 * Save a memory note with embedding
 */
export async function saveMemory(params: {
  userId: string;
  content: string;
  kind?: 'text' | 'audio' | 'video' | 'photo';
  sentiment?: string;
  topic?: string;
  subtopic?: string;
}): Promise<{ noteId: string; success: boolean }> {
  const { userId, content, kind = 'text', sentiment, topic, subtopic } = params;

  try {
    // 1. Create the note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        kind,
        content,
        sentiment,
        topic,
        subtopic,
        sensitivity: 'personal',
      })
      .select()
      .single();

    if (noteError || !note) {
      console.error('Error creating note:', noteError);
      return { noteId: '', success: false };
    }

    // 2. Generate embedding for the content
    const embedding = await generateEmbedding(content);

    if (embedding) {
      // 3. Save the embedding
      const { error: embeddingError } = await supabase
        .from('note_embeddings')
        .upsert({
          note_id: note.id,
          embedding,
        });

      if (embeddingError) {
        console.error('Error saving embedding:', embeddingError);
        // Note was created, just embedding failed - still partially successful
      }
    }

    return { noteId: note.id, success: true };
  } catch (error) {
    console.error('Failed to save memory:', error);
    return { noteId: '', success: false };
  }
}

// ========================================
// Memory Retrieval (RAG)
// ========================================

/**
 * Search for relevant memories using semantic similarity
 */
export async function searchMemories(params: {
  userId: string;
  query: string;
  limit?: number;
  threshold?: number;
}): Promise<Memory[]> {
  const { userId, query, limit = 5, threshold = 0.5 } = params;

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      console.error('Failed to generate query embedding');
      return [];
    }

    // Call the match_notes RPC function
    const { data, error } = await supabase.rpc('match_notes', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      filter_user_id: userId,
    });

    if (error) {
      console.error('Error searching memories:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      createdAt: item.created_at,
      sentiment: item.sentiment,
      topic: item.topic,
      similarity: item.similarity,
    }));
  } catch (error) {
    console.error('Failed to search memories:', error);
    return [];
  }
}

/**
 * Get relevant context for a conversation using RAG
 */
export async function getRelevantContext(params: {
  userId: string;
  currentMessage: string;
  recentMessages?: string[];
}): Promise<MemorySearchResult> {
  const { userId, currentMessage, recentMessages = [] } = params;

  try {
    // Combine current message with recent context for better retrieval
    const contextQuery = [currentMessage, ...recentMessages.slice(0, 3)].join(
      ' '
    );

    // Search for relevant memories
    const memories = await searchMemories({
      userId,
      query: contextQuery,
      limit: 5,
      threshold: 0.4, // Lower threshold for more results
    });

    // Generate a summary of the context
    let contextSummary = '';

    if (memories.length > 0) {
      const memoryContents = memories
        .map((m, i) => `[${i + 1}] ${m.content.slice(0, 200)}...`)
        .join('\n');

      contextSummary = `Based on the user's history, they have mentioned:\n${memoryContents}`;
    }

    return {
      memories,
      contextSummary,
    };
  } catch (error) {
    console.error('Failed to get relevant context:', error);
    return { memories: [], contextSummary: '' };
  }
}

// ========================================
// Memory Analysis
// ========================================

/**
 * Analyze and extract key information from user input
 */
export async function analyzeForMemory(params: {
  userId: string;
  content: string;
}): Promise<{
  shouldSave: boolean;
  sentiment?: string;
  topic?: string;
  subtopic?: string;
}> {
  const { content } = params;

  // Simple heuristics for now - could be enhanced with AI
  const shouldSave = content.length > 50; // Only save substantial messages

  // Basic sentiment detection
  const positiveWords = [
    'happy',
    'great',
    'love',
    'excited',
    'wonderful',
    'amazing',
  ];
  const negativeWords = [
    'sad',
    'angry',
    'frustrated',
    'worried',
    'stressed',
    'anxious',
  ];

  const words = content.toLowerCase().split(/\s+/);
  const hasPositive = words.some((w) =>
    positiveWords.some((pw) => w.includes(pw))
  );
  const hasNegative = words.some((w) =>
    negativeWords.some((nw) => w.includes(nw))
  );

  let sentiment = 'neutral';
  if (hasPositive && !hasNegative) sentiment = 'positive';
  if (hasNegative && !hasPositive) sentiment = 'negative';
  if (hasPositive && hasNegative) sentiment = 'mixed';

  // Basic topic detection
  const topicKeywords: Record<string, string[]> = {
    health: [
      'gym',
      'exercise',
      'workout',
      'health',
      'diet',
      'sleep',
      'wellness',
    ],
    work: [
      'work',
      'job',
      'career',
      'meeting',
      'project',
      'deadline',
      'colleague',
    ],
    relationships: [
      'friend',
      'family',
      'partner',
      'relationship',
      'love',
      'dating',
    ],
    finance: ['money', 'budget', 'savings', 'invest', 'salary', 'expense'],
    learning: ['learn', 'study', 'course', 'book', 'skill', 'practice'],
    personal: ['goal', 'dream', 'plan', 'future', 'habit', 'routine'],
  };

  let topic = 'general';
  for (const [topicName, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((kw) => content.toLowerCase().includes(kw))) {
      topic = topicName;
      break;
    }
  }

  return {
    shouldSave,
    sentiment,
    topic,
  };
}

// ========================================
// Auto-save from chat
// ========================================

/**
 * Automatically save important messages as memories
 */
export async function autoSaveFromChat(params: {
  userId: string;
  userMessage: string;
  aiResponse: string;
}): Promise<void> {
  const { userId, userMessage, aiResponse } = params;

  try {
    // Analyze the user message
    const analysis = await analyzeForMemory({ userId, content: userMessage });

    if (analysis.shouldSave) {
      // Save user message as memory
      await saveMemory({
        userId,
        content: userMessage,
        sentiment: analysis.sentiment,
        topic: analysis.topic,
      });
    }

    // Also save AI insights if they contain actionable information
    const actionKeywords = [
      'suggest',
      'recommend',
      'try',
      'consider',
      'remember',
      'goal',
    ];
    const hasActionable = actionKeywords.some((kw) =>
      aiResponse.toLowerCase().includes(kw)
    );

    if (hasActionable && aiResponse.length > 100) {
      await saveMemory({
        userId,
        content: `AI insight: ${aiResponse.slice(0, 500)}`,
        topic: analysis.topic,
        subtopic: 'ai_insight',
      });
    }
  } catch (error) {
    console.error('Failed to auto-save from chat:', error);
  }
}

// ========================================
// Memory Stats
// ========================================

/**
 * Get memory statistics for a user
 */
export async function getMemoryStats(userId: string): Promise<{
  totalMemories: number;
  topTopics: { topic: string; count: number }[];
  recentSentiments: { sentiment: string; count: number }[];
}> {
  try {
    // Get total count
    const { count: totalMemories } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get topic distribution
    const { data: topicData } = await supabase
      .from('notes')
      .select('topic')
      .eq('user_id', userId)
      .not('topic', 'is', null);

    const topicCounts: Record<string, number> = {};
    (topicData || []).forEach((item: { topic: string }) => {
      topicCounts[item.topic] = (topicCounts[item.topic] || 0) + 1;
    });

    const topTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent sentiments
    const { data: sentimentData } = await supabase
      .from('notes')
      .select('sentiment')
      .eq('user_id', userId)
      .not('sentiment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    const sentimentCounts: Record<string, number> = {};
    (sentimentData || []).forEach((item: { sentiment: string }) => {
      sentimentCounts[item.sentiment] =
        (sentimentCounts[item.sentiment] || 0) + 1;
    });

    const recentSentiments = Object.entries(sentimentCounts)
      .map(([sentiment, count]) => ({ sentiment, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMemories: totalMemories || 0,
      topTopics,
      recentSentiments,
    };
  } catch (error) {
    console.error('Failed to get memory stats:', error);
    return {
      totalMemories: 0,
      topTopics: [],
      recentSentiments: [],
    };
  }
}

// ========================================
// Backward Compatibility Exports
// ========================================

/**
 * Alias for searchMemories - retrieves relevant memories based on query
 * Supports both 'query' and 'currentMessage' for backward compatibility
 */
export async function retrieveRelevantMemories(params: {
  userId: string;
  query?: string;
  currentMessage?: string;
  limit?: number;
  threshold?: number;
}): Promise<Memory[]> {
  const query = params.query || params.currentMessage || '';
  if (!query) return [];

  return searchMemories({
    userId: params.userId,
    query,
    limit: params.limit,
    threshold: params.threshold,
  });
}

/**
 * Build context string from memories for AI prompts
 */
export function buildContextFromMemories(memories: Memory[]): string {
  if (!memories || memories.length === 0) {
    return '';
  }

  const memoryContext = memories
    .map((m, i) => {
      const topicInfo = m.topic ? ` [${m.topic}]` : '';
      const sentimentInfo = m.sentiment ? ` (${m.sentiment})` : '';
      return `Memory ${i + 1}${topicInfo}${sentimentInfo}: ${m.content}`;
    })
    .join('\n\n');

  return `\n\n--- User's Relevant Memories ---\n${memoryContext}\n--- End of Memories ---\n\n`;
}

export default {
  generateEmbedding,
  saveMemory,
  searchMemories,
  getRelevantContext,
  analyzeForMemory,
  autoSaveFromChat,
  getMemoryStats,
  retrieveRelevantMemories,
  buildContextFromMemories,
};
