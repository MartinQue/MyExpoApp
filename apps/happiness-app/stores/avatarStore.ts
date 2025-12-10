import { create } from 'zustand';

import {
  AVATAR_MANIFEST,
  type AvatarConfig,
  type AvatarId,
  getAvatarById as resolveAvatar,
  getDefaultAvatar,
} from '@/assets/avatars/avatar_manifest';
import { useUserStore } from './userStore';

export type AvatarLoadingStatus = 'idle' | 'loading' | 'ready';

interface AvatarState {
  avatars: AvatarConfig[];
  selectedAvatarId: AvatarId;
  loadingProgress: Partial<Record<AvatarId, number>>;
  status: AvatarLoadingStatus;
  selectAvatar: (avatarId: AvatarId) => void;
  setAvatarProgress: (avatarId: AvatarId, progress: number) => void;
  markAvatarReady: (avatarId: AvatarId) => void;
  resetAvatarProgress: (avatarId?: AvatarId) => void;
  getAvatarById: (avatarId: AvatarId) => AvatarConfig;
  getSelectedAvatar: () => AvatarConfig;
}

const resolveInitialAvatar = (): AvatarId => {
  const persisted = useUserStore.getState().selectedAvatarId;
  if (persisted) {
    return persisted as AvatarId;
  }
  return getDefaultAvatar().id;
};

export const useAvatarStore = create<AvatarState>((set, get) => ({
  avatars: AVATAR_MANIFEST,
  selectedAvatarId: resolveInitialAvatar(),
  loadingProgress: {},
  status: 'idle',
  selectAvatar: (avatarId) => {
    const userStore = useUserStore.getState();

    if (userStore.selectedAvatarId !== avatarId) {
      userStore.setSelectedAvatar(avatarId);
    }

    set({ selectedAvatarId: avatarId, status: 'loading' });
  },
  setAvatarProgress: (avatarId, progress) => {
    set((state) => ({
      loadingProgress: {
        ...state.loadingProgress,
        [avatarId]: Math.min(100, Math.max(0, progress)),
      },
      status: progress >= 100 ? 'ready' : 'loading',
    }));
  },
  markAvatarReady: (avatarId) => {
    set((state) => ({
      loadingProgress: {
        ...state.loadingProgress,
        [avatarId]: 100,
      },
      status: 'ready',
    }));
  },
  resetAvatarProgress: (avatarId) => {
    set((state) => {
      if (!avatarId) {
        return { loadingProgress: {}, status: 'idle' };
      }

      const { [avatarId]: _removed, ...rest } = state.loadingProgress;
      return {
        loadingProgress: rest,
        status: Object.keys(rest).length === 0 ? 'idle' : state.status,
      };
    });
  },
  getAvatarById: (avatarId) => resolveAvatar(avatarId),
  getSelectedAvatar: () => resolveAvatar(get().selectedAvatarId),
}));
