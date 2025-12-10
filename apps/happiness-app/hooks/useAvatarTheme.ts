import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useAvatarStore } from '@/stores/avatarStore';
import type { AvatarId } from '@/assets/avatars/avatar_manifest';

type GradientTuple = readonly [string, string];

interface AvatarTheme {
  avatarId: AvatarId;
  gradient: GradientTuple;
  baseColor: string;
  isDark: boolean;
  textColor: string;
  mutedTextColor: string;
}

export function useAvatarTheme(avatarId?: AvatarId): AvatarTheme {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const { getAvatarById, selectedAvatarId } = useAvatarStore();

  const theme = useMemo(() => {
    const activeId = avatarId ?? selectedAvatarId;
    const avatar = getAvatarById(activeId);
    const gradient = isDark ? avatar.gradientColors.dark : avatar.gradientColors.light;

    return {
      avatarId: activeId,
      gradient: gradient as GradientTuple,
      baseColor: avatar.defaultBackgroundColor,
      isDark,
      textColor: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,10,0.95)',
      mutedTextColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(10,10,10,0.6)',
    } satisfies AvatarTheme;
  }, [avatarId, selectedAvatarId, getAvatarById, isDark]);

  return theme;
}
