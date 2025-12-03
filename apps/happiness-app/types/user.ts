/**
 * User and authentication types
 */

import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  
  // Settings
  settings: UserSettings;
  
  // Subscription
  subscriptionTier: 'free' | 'pro' | 'pro_unlimited';
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  videoCredits: number;
  imageCredits: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  // Privacy
  memoryRetentionDays: number | 'unlimited';
  locationTracking: boolean;
  contextAwarePrivacy: boolean;
  
  // Notifications
  pushNotifications: boolean;
  dailyReminders: boolean;
  goalReminders: boolean;
  
  // AI Behavior
  responseStyle: 'concise' | 'detailed' | 'casual';
  voiceEnabled: boolean;
  autoSaveConversations: boolean;
  
  // Appearance
  theme: 'system' | 'dark';
  textSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;
}

export interface AuthState {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}
