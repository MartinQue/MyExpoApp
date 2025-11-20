import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, createProfile } from '@/lib/supabase';

interface UseUserReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<{ error: any }>;
}

export const useUser = (): UseUserReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);

        // Create profile if user exists but no profile
        if (session?.user) {
          await ensureProfile(session.user.id);
        }
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create profile for new users
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const ensureProfile = async (userId: string) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      // Create profile if it doesn't exist
      if (!existingProfile) {
        const { error } = await createProfile(userId);
        if (error) {
          console.error('Error creating profile:', error);
        } else {
          console.log('Profile created for user:', userId);
        }
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  };

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Configure for your app's deep linking
        emailRedirectTo: undefined, // Will use default
      },
    });

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    signInWithEmail,
  };
};
