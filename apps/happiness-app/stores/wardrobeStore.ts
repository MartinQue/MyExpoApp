import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import wardrobeManifest from '@/assets/avatars/wardrobe.json';
import type { AvatarId } from '@/assets/avatars/avatar_manifest';

type WardrobeCategory = 'tops' | 'bottoms' | 'accessories';

export interface WardrobeItem {
  id: string;
  name: string;
  preview: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description?: string;
}

export type WardrobeManifest = Record<
  AvatarId,
  Record<WardrobeCategory, WardrobeItem[]>
>;

export interface WardrobeSelection {
  topId?: string;
  bottomId?: string;
  accessoryId?: string;
}

interface WardrobeState {
  manifest: WardrobeManifest;
  selections: Record<AvatarId, WardrobeSelection>;
  setSelection: (
    avatarId: AvatarId,
    category: WardrobeCategory,
    itemId?: string
  ) => void;
  resetSelection: (avatarId: AvatarId) => void;
  getSelection: (avatarId: AvatarId) => WardrobeSelection;
  getItems: (avatarId: AvatarId, category: WardrobeCategory) => WardrobeItem[];
}

const typedManifest = wardrobeManifest as WardrobeManifest;

// Stable empty object to prevent infinite re-renders
const EMPTY_WARDROBE_SELECTION: WardrobeSelection = {};

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      manifest: typedManifest,
      selections: {},
      setSelection: (avatarId, category, itemId) =>
        set((state) => ({
          selections: {
            ...state.selections,
            [avatarId]: {
              ...state.selections[avatarId],
              [`${
                category === 'tops'
                  ? 'top'
                  : category === 'bottoms'
                  ? 'bottom'
                  : 'accessory'
              }Id`]: itemId,
            },
          },
        })),
      resetSelection: (avatarId) =>
        set((state) => {
          const next = { ...state.selections };
          delete next[avatarId];
          return { selections: next };
        }),
      getSelection: (avatarId) =>
        get().selections[avatarId] || EMPTY_WARDROBE_SELECTION,
      getItems: (avatarId, category) =>
        get().manifest[avatarId]?.[category] ?? [],
    }),
    {
      name: 'wardrobe-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selections: state.selections }),
    }
  )
);
