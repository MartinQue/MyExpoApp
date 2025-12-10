import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomAvatar {
  id: string;
  name: string;
  vrmUri: string;
  createdAt: number;
  preview?: string;
}

export type GenerationStatus = 'idle' | 'uploading' | 'generating' | 'ready' | 'error';

interface CustomAvatarState {
  avatars: CustomAvatar[];
  status: GenerationStatus;
  error?: string;
  setStatus: (status: GenerationStatus, error?: string) => void;
  addAvatar: (avatar: CustomAvatar) => void;
  removeAvatar: (id: string) => void;
  clearError: () => void;
}

export const useCustomAvatarStore = create<CustomAvatarState>()(
  persist(
    (set, get) => ({
      avatars: [],
      status: 'idle',
      error: undefined,
      setStatus: (status, error) => set({ status, error }),
      addAvatar: (avatar) =>
        set((state) => ({ avatars: [avatar, ...state.avatars], status: 'ready', error: undefined })),
      removeAvatar: (id) =>
        set((state) => ({ avatars: state.avatars.filter((avatar) => avatar.id !== id) })),
      clearError: () => set({ error: undefined }),
    }),
    {
      name: 'custom-avatar-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
