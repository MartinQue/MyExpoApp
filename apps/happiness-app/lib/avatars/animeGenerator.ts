import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { EncodingType, cacheDirectory, documentDirectory } from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

import { useCustomAvatarStore } from '@/stores/customAvatarStore';

export interface AnimeGenerationRequest {
  photoUri: string;
  avatarName?: string;
}

export interface AnimeGenerationResult {
  id: string;
  name: string;
  vrmUri: string;
  preview?: string;
}

export async function generateAnimeVRM({
  photoUri,
  avatarName,
}: AnimeGenerationRequest): Promise<AnimeGenerationResult> {
  const { setStatus, addAvatar } = useCustomAvatarStore.getState();

  try {
    setStatus('uploading');

    // In a real implementation, the photo would be uploaded to your server here.
    // For now, simulate network latency.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus('generating');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const id = uuidv4();
    const cacheDir = cacheDirectory || documentDirectory || '';
    const vrmUri = `${cacheDir}custom-avatar-${id}.vrm`;

    if (Platform.OS !== 'web') {
      await FileSystem.writeAsStringAsync(vrmUri, 'VRM_PLACEHOLDER', {
        encoding: EncodingType.UTF8,
      });
    }

    const result: AnimeGenerationResult = {
      id,
      name: avatarName || `My Avatar ${new Date().toLocaleDateString()}`,
      vrmUri,
    };

    addAvatar({
      ...result,
      createdAt: Date.now(),
    });

    return result;
  } catch (error) {
    console.error('Anime generation failed:', error);
    setStatus('error', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
