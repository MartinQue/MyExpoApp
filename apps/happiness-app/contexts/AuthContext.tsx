/**
 * AuthContext - Manages authentication state and syncs all stores
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import { usePlannerStore } from '@/stores/plannerStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useImagineStore } from '@/stores/imagineStore';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Store setters
  const setUserStoreUserId = useUserStore((s) => s.checkAuth);
  const setChatUserId = useChatStore((s) => s.setUserId);
  const setPlannerUserId = usePlannerStore((s) => s.setUserId);
  const setLibraryUserId = useLibraryStore((s) => s.setUserId);
  const setImagineUserId = useImagineStore((s) => s.setUserId);

  // Sync all stores with user ID
  const syncStoresWithUser = (userId: string | null) => {
    setChatUserId(userId);
    setPlannerUserId(userId);
    setLibraryUserId(userId);
    setImagineUserId(userId);
  };

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);

          // Initialize userStore with auth check
          await setUserStoreUserId();

          // Sync all stores with user ID
          syncStoresWithUser(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user) {
        // User signed in - sync all stores
        await setUserStoreUserId();
        syncStoresWithUser(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear user IDs from stores
        syncStoresWithUser(null);
      } else if (event === 'TOKEN_REFRESHED' && newSession?.user) {
        // Token refreshed - ensure stores are synced
        syncStoresWithUser(newSession.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
