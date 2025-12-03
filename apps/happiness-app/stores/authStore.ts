/**
 * Auth store using Zustand
 */

import { create } from 'zustand';
import { AuthState } from '@/types/user';

interface AuthStore extends AuthState {
  setUser: (user: AuthState['user']) => void;
  setProfile: (profile: AuthState['profile']) => void;
  setSession: (session: AuthState['session']) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));
