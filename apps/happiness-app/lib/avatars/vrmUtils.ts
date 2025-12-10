import type { WardrobeSelection } from '@/stores/wardrobeStore';

export interface ApplyWardrobeOptions {
  avatarId: string;
  selection: WardrobeSelection;
}

export async function applyWardrobeToVRM({
  avatarId,
  selection,
}: ApplyWardrobeOptions): Promise<void> {
  console.log('[VRM] applyWardrobeToVRM', { avatarId, selection });
  return Promise.resolve();
}

export async function applyCustomAvatar(vrmUri: string): Promise<void> {
  console.log('[VRM] applyCustomAvatar', { vrmUri });
  return Promise.resolve();
}
