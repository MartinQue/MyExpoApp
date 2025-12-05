/**
 * Example: Service Layer Template
 *
 * This is a reference implementation showing the standard pattern
 * for creating service classes in the MyExpoApp monorepo.
 *
 * Key Features:
 * - Static methods
 * - Error handling
 * - TypeScript types
 * - Supabase integration
 * - Clear method naming
 */

import { supabase } from '@/lib/supabase';

// 1. Import Types
interface Item {
  id: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface CreateItemInput {
  title: string;
  description: string;
}

interface UpdateItemInput {
  title?: string;
  description?: string;
}

// 2. Service Class
export class ExampleService {
  /**
   * Get all items for a user
   *
   * @param userId - The user's ID
   * @returns Array of items
   * @throws Error if query fails
   */
  static async getItems(userId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single item by ID
   *
   * @param id - The item ID
   * @returns The item
   * @throws Error if not found or query fails
   */
  static async getItemById(id: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch item: ${error.message}`);
    }

    if (!data) {
      throw new Error('Item not found');
    }

    return data;
  }

  /**
   * Create a new item
   *
   * @param userId - The user's ID
   * @param input - Item data
   * @returns The created item
   * @throws Error if creation fails
   */
  static async createItem(
    userId: string,
    input: CreateItemInput
  ): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .insert({
        ...input,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create item: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing item
   *
   * @param id - The item ID
   * @param updates - Fields to update
   * @returns The updated item
   * @throws Error if update fails
   */
  static async updateItem(
    id: string,
    updates: UpdateItemInput
  ): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an item
   *
   * @param id - The item ID
   * @throws Error if deletion fails
   */
  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Search items by title
   *
   * @param userId - The user's ID
   * @param query - Search query
   * @returns Matching items
   */
  static async searchItems(userId: string, query: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get items with pagination
   *
   * @param userId - The user's ID
   * @param page - Page number (0-indexed)
   * @param pageSize - Items per page
   * @returns Paginated items
   */
  static async getItemsPaginated(
    userId: string,
    page: number = 0,
    pageSize: number = 20
  ): Promise<{ items: Item[]; totalCount: number }> {
    const start = page * pageSize;
    const end = start + pageSize - 1;

    // Get paginated data
    const { data, error, count } = await supabase
      .from('items')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    return {
      items: data || [],
      totalCount: count || 0,
    };
  }
}

// ========================================
// AI Service Example (OpenAI)
// ========================================

import { openai } from '@/lib/openai';

export class AIService {
  /**
   * Generate text using GPT-4
   */
  static async generateText(prompt: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(
        `Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate image using DALL-E 3
   */
  static async generateImage(prompt: string): Promise<string> {
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      return response.data[0]?.url || '';
    } catch (error) {
      throw new Error(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Transcribe audio using Whisper
   */
  static async transcribeAudio(audioFile: File): Promise<string> {
    try {
      const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en',
      });

      return response.text;
    } catch (error) {
      throw new Error(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// ========================================
// Usage Examples (for documentation)
// ========================================

/*
// 1. Fetch items in a store
const fetchItems = async (userId: string) => {
  try {
    const items = await ExampleService.getItems(userId);
    set({ items, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
};

// 2. Create item with error handling
const createItem = async (input: CreateItemInput) => {
  try {
    const newItem = await ExampleService.createItem(userId, input);
    return newItem;
  } catch (error) {
    console.error('Failed to create item:', error);
    throw error;
  }
};

// 3. Search with debouncing
const searchItems = async (query: string) => {
  if (query.length < 2) return;

  const results = await ExampleService.searchItems(userId, query);
  setSearchResults(results);
};

// 4. Pagination
const loadMore = async () => {
  const { items, totalCount } = await ExampleService.getItemsPaginated(
    userId,
    currentPage + 1,
    20
  );

  setItems((prev) => [...prev, ...items]);
  setCurrentPage((prev) => prev + 1);
  setHasMore(items.length + currentItems.length < totalCount);
};
*/

// ========================================
// Best Practices
// ========================================

/*
✅ DO:
- Use static methods for stateless operations
- Throw descriptive errors
- Add JSDoc comments
- Return typed data
- Handle all error cases
- Keep services focused on a single domain

❌ DON'T:
- Call APIs directly from components
- Ignore errors
- Use 'any' type
- Put UI logic in services
- Make services stateful (use stores for state)
- Mix domains in a single service
*/
