import { create } from 'zustand';

export interface User {
  name: string;
  avatar: string;
  credits: number;
  isPro: boolean;
  mood: string;
}

interface UserState {
  user: User;
  setUser: (user: User) => void;
  updateCredits: (amount: number) => void;
  setMood: (mood: string) => void;
  togglePro: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: {
    name: 'Martin',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
    credits: 3, // Free tier limit
    isPro: false,
    mood: 'neutral',
  },
  setUser: (user) => set({ user }),
  updateCredits: (amount) =>
    set((state) => ({
      user: { ...state.user, credits: state.user.credits + amount },
    })),
  setMood: (mood) =>
    set((state) => ({
      user: { ...state.user, mood },
    })),
  togglePro: () =>
    set((state) => ({
      user: { ...state.user, isPro: !state.user.isPro },
    })),
  theme: 'dark' as 'light' | 'dark',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));
