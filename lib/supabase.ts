import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/constants/Config';

// Validate environment variables before creating client
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ MISSING SUPABASE CREDENTIALS!');
  console.error('Please add to .env:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key');
  throw new Error(
    'Supabase credentials missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

// Initialize Supabase client
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      // Configure auth for Expo
      storage: undefined, // Use default AsyncStorage
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disable for mobile
    },
  }
);

// Database types (generated from Supabase CLI or manually defined)
export interface Database {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          kind: 'text' | 'audio' | 'video' | 'photo';
          content: string | null;
          media_url: string | null;
          sensitivity: 'private' | 'personal' | 'shared';
          topic: string | null;
          subtopic: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: 'text' | 'audio' | 'video' | 'photo';
          content?: string | null;
          media_url?: string | null;
          sensitivity?: 'private' | 'personal' | 'shared';
          topic?: string | null;
          subtopic?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'text' | 'audio' | 'video' | 'photo';
          content?: string | null;
          media_url?: string | null;
          sensitivity?: 'private' | 'personal' | 'shared';
          topic?: string | null;
          subtopic?: string | null;
          created_at?: string;
        };
      };
      note_embeddings: {
        Row: {
          note_id: string;
          embedding: number[];
        };
        Insert: {
          note_id: string;
          embedding: number[];
        };
        Update: {
          note_id?: string;
          embedding?: number[];
        };
      };
      profiles: {
        Row: {
          user_id: string;
          trial_started_at: string;
          trial_days: number;
        };
        Insert: {
          user_id: string;
          trial_started_at?: string;
          trial_days?: number;
        };
        Update: {
          user_id?: string;
          trial_started_at?: string;
          trial_days?: number;
        };
      };
      planner_tasks: {
        Row: {
          id: string;
          user_id: string;
          note_id: string | null;
          when: string;
          why: string | null;
          youtube_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          note_id?: string | null;
          when: string;
          why?: string | null;
          youtube_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string | null;
          when?: string;
          why?: string | null;
          youtube_url?: string | null;
        };
      };
      media: {
        Row: {
          id: string;
          note_id: string | null;
          type: 'photo' | 'video' | null;
          media_url: string | null;
          exif_json: any | null;
        };
        Insert: {
          id?: string;
          note_id?: string | null;
          type?: 'photo' | 'video' | null;
          media_url?: string | null;
          exif_json?: any | null;
        };
        Update: {
          id?: string;
          note_id?: string | null;
          type?: 'photo' | 'video' | null;
          media_url?: string | null;
          exif_json?: any | null;
        };
      };
    };
  };
}

// Storage helpers
export const uploadAsset = async (
  file: File | Blob,
  path: string,
  bucket: string = 'media'
): Promise<{ data: any; error: any }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const publicUrlFor = (
  path: string,
  bucket: string = 'media'
): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
};

// Embedding stub function
export const saveEmbedding = async (
  noteId: string,
  text: string
): Promise<{ data: any; error: any }> => {
  // TODO: Implement OpenAI embedding generation
  console.log('saveEmbedding called with:', { noteId, text });

  // Placeholder - will be replaced with actual OpenAI call
  const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());

  try {
    const { data, error } = await supabase.from('note_embeddings').upsert({
      note_id: noteId,
      embedding: mockEmbedding,
    });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Helper functions for common database operations
export const createNote = async (
  note: Database['public']['Tables']['notes']['Insert']
) => {
  return await supabase.from('notes').insert(note).select().single();
};

export const getUserNotes = async (userId: string) => {
  return await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const createProfile = async (userId: string) => {
  return await supabase.from('profiles').insert({
    user_id: userId,
    trial_started_at: new Date().toISOString(),
    trial_days: 14,
  });
};
