import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, type UserPreferences } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export interface User {
  id?: string;
  name: string;
  avatar: string;
  credits: number;
  isPro: boolean;
  mood: string;
  email?: string;
}

interface UserState {
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark';

  // Settings
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  voiceEnabled: boolean;

  // Feed interactions
  likedCards: string[];
  bookmarkedCards: string[];

  // Actions
  setUser: (user: Partial<User>) => void;
  updateCredits: (amount: number) => void;
  setMood: (mood: string) => void;
  togglePro: () => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Settings actions
  setNotificationsEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setVoiceEnabled: (enabled: boolean) => void;

  // Feed actions
  toggleLikeCard: (cardId: string) => void;
  toggleBookmarkCard: (cardId: string) => void;
  isCardLiked: (cardId: string) => boolean;
  isCardBookmarked: (cardId: string) => boolean;

  // Auth actions
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Supabase sync
  loadPreferences: () => Promise<void>;
  syncPreferences: () => Promise<void>;
}

const defaultUser: User = {
  name: 'Guest',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
  credits: 10,
  isPro: false,
  mood: 'neutral',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      isAuthenticated: false,
      isLoading: false,
      theme: 'dark',
      notificationsEnabled: true,
      hapticEnabled: true,
      voiceEnabled: true,
      likedCards: [],
      bookmarkedCards: [],

      setUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      updateCredits: async (amount) => {
        const state = get();
        const newCredits = Math.max(0, state.user.credits + amount);

        set((s) => ({
          user: { ...s.user, credits: newCredits },
        }));

        // Sync to Supabase
        if (state.user.id) {
          db.preferences
            .updateCredits(state.user.id, amount)
            .catch(console.error);
        }
      },

      setMood: (mood) => {
        set((state) => ({
          user: { ...state.user, mood },
        }));

        // Sync to Supabase
        const userId = get().user.id;
        if (userId) {
          db.preferences.upsert(userId, { mood }).catch(console.error);
        }
      },

      togglePro: () => {
        set((state) => ({
          user: { ...state.user, isPro: !state.user.isPro },
        }));

        // Sync to Supabase
        const state = get();
        if (state.user.id) {
          db.preferences
            .upsert(state.user.id, { is_pro: state.user.isPro })
            .catch(console.error);
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });

        // Sync to Supabase
        const userId = get().user.id;
        if (userId) {
          db.preferences
            .upsert(userId, { theme: newTheme })
            .catch(console.error);
        }
      },

      setTheme: (theme) => {
        set({ theme });

        // Sync to Supabase
        const userId = get().user.id;
        if (userId) {
          db.preferences.upsert(userId, { theme }).catch(console.error);
        }
      },

      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });

        const userId = get().user.id;
        if (userId) {
          db.preferences
            .upsert(userId, { notification_enabled: enabled })
            .catch(console.error);
        }
      },

      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });

        const userId = get().user.id;
        if (userId) {
          db.preferences
            .upsert(userId, { haptic_enabled: enabled })
            .catch(console.error);
        }
      },

      setVoiceEnabled: (enabled) => {
        set({ voiceEnabled: enabled });

        const userId = get().user.id;
        if (userId) {
          db.preferences
            .upsert(userId, { voice_enabled: enabled })
            .catch(console.error);
        }
      },

      toggleLikeCard: (cardId) => {
        set((state) => {
          const isLiked = state.likedCards.includes(cardId);
          return {
            likedCards: isLiked
              ? state.likedCards.filter((id) => id !== cardId)
              : [...state.likedCards, cardId],
          };
        });
      },

      toggleBookmarkCard: (cardId) => {
        set((state) => {
          const isBookmarked = state.bookmarkedCards.includes(cardId);
          return {
            bookmarkedCards: isBookmarked
              ? state.bookmarkedCards.filter((id) => id !== cardId)
              : [...state.bookmarkedCards, cardId],
          };
        });
      },

      isCardLiked: (cardId) => get().likedCards.includes(cardId),
      isCardBookmarked: (cardId) => get().bookmarkedCards.includes(cardId),

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            const prefs = await db.preferences.get(data.user.id);

            set({
              user: {
                id: data.user.id,
                name:
                  prefs?.display_name ||
                  data.user.email?.split('@')[0] ||
                  'User',
                email: data.user.email,
                avatar: prefs?.avatar_url || defaultUser.avatar,
                credits: prefs?.credits || 10,
                isPro: prefs?.is_pro || false,
                mood: prefs?.mood || 'neutral',
              },
              isAuthenticated: true,
              isLoading: false,
              theme: (prefs?.theme as 'light' | 'dark') || 'dark',
              notificationsEnabled: prefs?.notification_enabled ?? true,
              hapticEnabled: prefs?.haptic_enabled ?? true,
              voiceEnabled: prefs?.voice_enabled ?? true,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Unknown error occurred' };
        } catch (e) {
          set({ isLoading: false });
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },

      signUp: async (email, password, name) => {
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Create user preferences
            await db.preferences.upsert(data.user.id, {
              display_name: name,
              credits: 10,
              theme: 'dark',
            });

            set({
              user: {
                id: data.user.id,
                name,
                email: data.user.email,
                avatar: defaultUser.avatar,
                credits: 10,
                isPro: false,
                mood: 'neutral',
              },
              isAuthenticated: true,
              isLoading: false,
            });

            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Unknown error occurred' };
        } catch (e) {
          set({ isLoading: false });
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: defaultUser,
          isAuthenticated: false,
          theme: 'dark',
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const prefs = await db.preferences.get(user.id);

            set({
              user: {
                id: user.id,
                name:
                  prefs?.display_name || user.email?.split('@')[0] || 'User',
                email: user.email,
                avatar: prefs?.avatar_url || defaultUser.avatar,
                credits: prefs?.credits || 10,
                isPro: prefs?.is_pro || false,
                mood: prefs?.mood || 'neutral',
              },
              isAuthenticated: true,
              isLoading: false,
              theme: (prefs?.theme as 'light' | 'dark') || 'dark',
              notificationsEnabled: prefs?.notification_enabled ?? true,
              hapticEnabled: prefs?.haptic_enabled ?? true,
              voiceEnabled: prefs?.voice_enabled ?? true,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (e) {
          console.error('Auth check failed:', e);
          set({ isLoading: false });
        }
      },

      loadPreferences: async () => {
        const userId = get().user.id;
        if (!userId) return;

        try {
          const prefs = await db.preferences.get(userId);
          if (prefs) {
            set({
              user: {
                ...get().user,
                credits: prefs.credits,
                isPro: prefs.is_pro,
                mood: prefs.mood || 'neutral',
              },
              theme: (prefs.theme as 'light' | 'dark') || 'dark',
              notificationsEnabled: prefs.notification_enabled,
              hapticEnabled: prefs.haptic_enabled,
              voiceEnabled: prefs.voice_enabled,
            });
          }
        } catch (e) {
          console.error('Failed to load preferences:', e);
        }
      },

      syncPreferences: async () => {
        const state = get();
        if (!state.user.id) return;

        try {
          await db.preferences.upsert(state.user.id, {
            display_name: state.user.name,
            avatar_url: state.user.avatar,
            theme: state.theme,
            mood: state.user.mood,
            credits: state.user.credits,
            is_pro: state.user.isPro,
            notification_enabled: state.notificationsEnabled,
            haptic_enabled: state.hapticEnabled,
            voice_enabled: state.voiceEnabled,
          });
        } catch (e) {
          console.error('Failed to sync preferences:', e);
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        notificationsEnabled: state.notificationsEnabled,
        hapticEnabled: state.hapticEnabled,
        voiceEnabled: state.voiceEnabled,
        likedCards: state.likedCards,
        bookmarkedCards: state.bookmarkedCards,
      }),
    }
  )
);
