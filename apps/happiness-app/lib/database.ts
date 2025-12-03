/**
 * Database Service Layer
 * Provides typed functions for all Supabase CRUD operations
 */

import { supabase } from './supabase';

// ========================================
// Type Definitions
// ========================================

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  last_message_preview: string | null;
  active_agent: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  agent_name: string | null;
  media_url: string | null;
  media_type: 'image' | 'audio' | 'video' | 'file' | null;
  created_at: string;
}

export interface Plan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  progress: number;
  next_task: string | null;
  due_date: string | null;
  motivation_quote: string | null;
  theme_color: string | null;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  plan_id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  position: number;
  created_at: string;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  category: 'personal' | 'notes';
  type: 'image' | 'video' | 'voice-memo' | 'meeting';
  title: string;
  url: string | null;
  thumbnail: string | null;
  duration: string | null;
  summary: string | null;
  transcript: string | null;
  action_items: string[];
  participants: string[];
  tags: string[];
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  enhanced_prompt: string | null;
  image_url: string;
  style: string | null;
  aspect_ratio: string | null;
  credits_used: number;
  favorited: boolean;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  theme: 'light' | 'dark' | 'system';
  mood: string | null;
  credits: number;
  is_pro: boolean;
  notification_enabled: boolean;
  haptic_enabled: boolean;
  voice_enabled: boolean;
  updated_at: string;
}

// ========================================
// Conversations & Messages
// ========================================

export const db = {
  // ---- Conversations ----
  conversations: {
    async list(userId: string): Promise<Conversation[]> {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
      return data || [];
    },

    async get(conversationId: string): Promise<Conversation | null> {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return null;
      }
      return data;
    },

    async create(userId: string, title?: string): Promise<Conversation | null> {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: title || 'New Chat',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }
      return data;
    },

    async update(
      conversationId: string,
      updates: Partial<Conversation>
    ): Promise<boolean> {
      const { error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation:', error);
        return false;
      }
      return true;
    },

    async delete(conversationId: string): Promise<boolean> {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }
      return true;
    },
  },

  // ---- Messages ----
  messages: {
    async list(conversationId: string): Promise<Message[]> {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      return data || [];
    },

    async create(
      message: Omit<Message, 'id' | 'created_at'>
    ): Promise<Message | null> {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) {
        console.error('Error creating message:', error);
        return null;
      }

      // Update conversation preview
      await supabase
        .from('conversations')
        .update({
          last_message_preview: message.content.slice(0, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', message.conversation_id);

      return data;
    },

    async delete(messageId: string): Promise<boolean> {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        return false;
      }
      return true;
    },
  },

  // ---- Plans & Milestones ----
  plans: {
    async list(userId: string, status?: Plan['status']): Promise<Plan[]> {
      let query = supabase
        .from('plans')
        .select('*, milestones(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching plans:', error);
        return [];
      }
      return data || [];
    },

    async get(planId: string): Promise<Plan | null> {
      const { data, error } = await supabase
        .from('plans')
        .select('*, milestones(*)')
        .eq('id', planId)
        .single();

      if (error) {
        console.error('Error fetching plan:', error);
        return null;
      }
      return data;
    },

    async create(
      plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
    ): Promise<Plan | null> {
      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select()
        .single();

      if (error) {
        console.error('Error creating plan:', error);
        return null;
      }
      return data;
    },

    async update(planId: string, updates: Partial<Plan>): Promise<boolean> {
      const { milestones, ...planUpdates } = updates;

      const { error } = await supabase
        .from('plans')
        .update(planUpdates)
        .eq('id', planId);

      if (error) {
        console.error('Error updating plan:', error);
        return false;
      }
      return true;
    },

    async delete(planId: string): Promise<boolean> {
      const { error } = await supabase.from('plans').delete().eq('id', planId);

      if (error) {
        console.error('Error deleting plan:', error);
        return false;
      }
      return true;
    },

    async addMilestone(
      planId: string,
      title: string
    ): Promise<Milestone | null> {
      // Get current max position
      const { data: existing } = await supabase
        .from('milestones')
        .select('position')
        .eq('plan_id', planId)
        .order('position', { ascending: false })
        .limit(1);

      const position = existing?.[0]?.position ?? -1;

      const { data, error } = await supabase
        .from('milestones')
        .insert({
          plan_id: planId,
          title,
          status: 'upcoming',
          position: position + 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding milestone:', error);
        return null;
      }
      return data;
    },

    async updateMilestone(
      milestoneId: string,
      status: Milestone['status']
    ): Promise<boolean> {
      const { error } = await supabase
        .from('milestones')
        .update({ status })
        .eq('id', milestoneId);

      if (error) {
        console.error('Error updating milestone:', error);
        return false;
      }

      // Recalculate plan progress
      const { data: milestone } = await supabase
        .from('milestones')
        .select('plan_id')
        .eq('id', milestoneId)
        .single();

      if (milestone) {
        const { data: allMilestones } = await supabase
          .from('milestones')
          .select('status')
          .eq('plan_id', milestone.plan_id);

        if (allMilestones && allMilestones.length > 0) {
          const completed = allMilestones.filter(
            (m) => m.status === 'completed'
          ).length;
          const progress = Math.round((completed / allMilestones.length) * 100);

          await supabase
            .from('plans')
            .update({ progress })
            .eq('id', milestone.plan_id);
        }
      }

      return true;
    },
  },

  // ---- Library Items ----
  library: {
    async list(
      userId: string,
      category?: LibraryItem['category']
    ): Promise<LibraryItem[]> {
      let query = supabase
        .from('library_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching library items:', error);
        return [];
      }
      return data || [];
    },

    async create(
      item: Omit<LibraryItem, 'id' | 'created_at'>
    ): Promise<LibraryItem | null> {
      const { data, error } = await supabase
        .from('library_items')
        .insert(item)
        .select()
        .single();

      if (error) {
        console.error('Error creating library item:', error);
        return null;
      }
      return data;
    },

    async update(
      itemId: string,
      updates: Partial<LibraryItem>
    ): Promise<boolean> {
      const { error } = await supabase
        .from('library_items')
        .update(updates)
        .eq('id', itemId);

      if (error) {
        console.error('Error updating library item:', error);
        return false;
      }
      return true;
    },

    async delete(itemId: string): Promise<boolean> {
      const { error } = await supabase
        .from('library_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting library item:', error);
        return false;
      }
      return true;
    },
  },

  // ---- Generated Images ----
  images: {
    async list(userId: string, limit = 20): Promise<GeneratedImage[]> {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching generated images:', error);
        return [];
      }
      return data || [];
    },

    async create(
      image: Omit<GeneratedImage, 'id' | 'created_at'>
    ): Promise<GeneratedImage | null> {
      const { data, error } = await supabase
        .from('generated_images')
        .insert(image)
        .select()
        .single();

      if (error) {
        console.error('Error saving generated image:', error);
        return null;
      }
      return data;
    },

    async toggleFavorite(
      imageId: string,
      favorited: boolean
    ): Promise<boolean> {
      const { error } = await supabase
        .from('generated_images')
        .update({ favorited })
        .eq('id', imageId);

      if (error) {
        console.error('Error toggling favorite:', error);
        return false;
      }
      return true;
    },

    async delete(imageId: string): Promise<boolean> {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }
      return true;
    },
  },

  // ---- User Preferences ----
  preferences: {
    async get(userId: string): Promise<UserPreferences | null> {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Not found error
        console.error('Error fetching preferences:', error);
        return null;
      }
      return data;
    },

    async upsert(
      userId: string,
      preferences: Partial<UserPreferences>
    ): Promise<boolean> {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: userId,
        ...preferences,
      });

      if (error) {
        console.error('Error upserting preferences:', error);
        return false;
      }
      return true;
    },

    async updateCredits(userId: string, delta: number): Promise<number | null> {
      const current = await this.get(userId);
      if (!current) return null;

      const newCredits = Math.max(0, current.credits + delta);

      const { error } = await supabase
        .from('user_preferences')
        .update({ credits: newCredits })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating credits:', error);
        return null;
      }
      return newCredits;
    },
  },

  // ---- Auth Helpers ----
  auth: {
    async getCurrentUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }
      return user;
    },

    async getCurrentUserId(): Promise<string | null> {
      const user = await this.getCurrentUser();
      return user?.id || null;
    },

    onAuthStateChange(callback: (userId: string | null) => void) {
      return supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user?.id || null);
      });
    },
  },
};

export default db;
