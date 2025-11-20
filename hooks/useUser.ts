/**
 * useUser hook for authentication state management
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

export function useUser() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setError(error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch user profile when logged in
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      // TODO: Transform database profile to UserProfile type
      // For now, create a basic profile
      const userProfile: UserProfile = {
        id: userId,
        email: user?.email || '',
        fullName: data?.full_name,
        avatarUrl: data?.avatar_url,
        settings: {
          memoryRetentionDays: 'unlimited',
          locationTracking: true,
          contextAwarePrivacy: true,
          pushNotifications: true,
          dailyReminders: true,
          goalReminders: true,
          responseStyle: 'detailed',
          voiceEnabled: false,
          autoSaveConversations: true,
          theme: 'dark',
          textSize: 'medium',
          animationsEnabled: true,
        },
        subscriptionTier: data?.subscription_tier || 'free',
        subscriptionStatus: data?.subscription_status,
        videoCredits: data?.video_credits || 3,
        imageCredits: data?.image_credits || 10,
        createdAt: new Date(data?.created_at),
        updatedAt: new Date(data?.updated_at),
      };
      
      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  return {
    user,
    profile,
    session,
    isLoading,
    error,
    signOut,
    refreshProfile,
  };
}
