// lib/memory.ts
// RAG-powered memory system for alter_ego
import { supabase } from './supabase';
import { OPENAI_API_KEY } from '../constants/Config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface Memory {
  id: string;
  content: string;
  timestamp: string;
  sentiment?: string;
  topic?: string;
  similarity?: number;
}

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key required for embeddings');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // Cheaper and faster
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Save a message to memory with embedding
 */
export async function saveToMemory(params: {
  userId: string;
  text: string;
  kind: 'text';
  sentiment?: string;
  topic?: string;
  summary?: string;
  nextStep?: string;
}): Promise<string> {
  if (!OPENAI_API_KEY) {
    console.warn('Supabase configuration missing; skipping memory save.');
    return '';
  }
  try {
    // 1. Save the note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        user_id: params.userId,
        kind: params.kind,
        content: params.text,
        sentiment: params.sentiment,
        topic: params.topic,
        summary: params.summary,
        next_step: params.nextStep,
        sensitivity: 'personal',
      })
      .select()
      .single();

    if (noteError || !note) {
      console.error('Error saving note:', noteError);
      throw noteError;
    }

    // 2. Generate and save embedding (for RAG retrieval)
    try {
      const embedding = await generateEmbedding(params.text);

      const { error: embeddingError } = await supabase
        .from('note_embeddings')
        .insert({
          note_id: note.id,
          embedding: embedding,
        });

      if (embeddingError) {
        console.error('Error saving embedding:', embeddingError);
        // Don't fail the whole operation if embedding fails
      }
    } catch (embError) {
      console.error('Embedding generation failed:', embError);
      // Continue even if embedding fails
    }

    return note.id;
  } catch (error) {
    console.error('Error in saveToMemory:', error);
    throw error;
  }
}

/**
 * Validate if a string is a valid UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Retrieve relevant memories using semantic search (RAG)
 * This is the MAGIC - finds past conversations similar to current context
 */
export async function retrieveRelevantMemories(params: {
  userId: string;
  currentMessage: string;
  limit?: number;
}): Promise<Memory[]> {
  try {
    // Validate UUID format (handles testing mode gracefully)
    if (!isValidUUID(params.userId)) {
      console.log('⚠️ Invalid userId format, skipping memory retrieval');
      return [];
    }

    const limit = params.limit || 5;

    // Generate embedding for current message
    const queryEmbedding = await generateEmbedding(params.currentMessage);

    // Use Supabase vector similarity search
    // This finds the most semantically similar past messages
    const { data, error } = await supabase.rpc('match_notes', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7, // Only return fairly similar memories
      match_count: limit,
      filter_user_id: params.userId,
    });

    if (error) {
      console.error('Error retrieving memories:', error);
      // Fallback to recent memories if vector search fails
      return await getRecentMemories(params.userId, limit);
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      content: item.content,
      timestamp: item.created_at,
      sentiment: item.sentiment,
      topic: item.topic,
      similarity: item.similarity,
    }));
  } catch (error) {
    console.error('Error in retrieveRelevantMemories:', error);
    // Fallback to recent memories
    return await getRecentMemories(params.userId, params.limit || 5);
  }
}

/**
 * Fallback: Get recent memories (when vector search unavailable)
 */
async function getRecentMemories(userId: string, limit: number): Promise<Memory[]> {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((note) => ({
    id: note.id,
    content: note.content || '',
    timestamp: note.created_at,
    sentiment: note.sentiment,
    topic: note.topic,
  }));
}

/**
 * Get conversation history (for displaying in chat)
 */
export async function getConversationHistory(params: {
  userId: string;
  limit?: number;
}): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(params.limit || 50);

  if (error || !data) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  return data.map((note) => ({
    id: note.id,
    content: note.content || '',
    timestamp: note.created_at,
    sentiment: note.sentiment,
    topic: note.topic,
  }));
}

/**
 * Build context for AI from relevant memories
 * This creates the "alter_ego knows you deeply" effect
 */
export function buildContextFromMemories(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'This is your first conversation with the user.';
  }

  let context = 'Past conversations and context about the user:\n\n';

  memories.forEach((memory, index) => {
    context += `${index + 1}. [${new Date(memory.timestamp).toLocaleDateString()}] ${memory.content}\n`;
    if (memory.sentiment) {
      context += `   Sentiment: ${memory.sentiment}\n`;
    }
    if (memory.topic) {
      context += `   Topic: ${memory.topic}\n`;
    }
    context += '\n';
  });

  context += '\nUse this context to provide personalized, empathetic responses that show you remember and understand the user deeply.';

  return context;
}
