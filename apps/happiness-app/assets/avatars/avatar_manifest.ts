import { Asset } from 'expo-asset';

/**
 * Avatar Manifest
 * Configuration for all available VRM avatars
 */

export type AvatarId = 'airi' | 'calm' | 'heart' | 'mind' | 'rise';

export type AnimationPose =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'thinking'
  | 'celebrating';

export interface AvatarConfig {
  id: AvatarId;
  name: string;
  description: string;
  asset: string;
  modelModule: number;
  thumbnail: number;
  defaultBackgroundColor: string;
  defaultAnimationPose: AnimationPose;
  gradientColors: {
    dark: [string, string];
    light: [string, string];
  };
  personality?: string;
  greeting?: string;
}

export const AVATAR_MANIFEST: AvatarConfig[] = [
  {
    id: 'airi',
    name: 'Airi',
    description: 'The main character - energetic and friendly',
    modelModule: require('./vrm/Airi.vrm'),
    asset: Asset.fromModule(require('./vrm/Airi.vrm')).uri,
    thumbnail: require('./images/airi.png'),
    defaultBackgroundColor: '#FF6B9D',
    defaultAnimationPose: 'idle',
    gradientColors: {
      dark: ['#2a1a2e', '#0f0a12'],
      light: ['#fff0f5', '#ffe4ec'],
    },
    personality: 'Energetic and friendly',
    greeting: "Hi! I'm Airi! Ready to chat?",
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Serene and peaceful companion',
    modelModule: require('./vrm/Calm.vrm'),
    asset: Asset.fromModule(require('./vrm/Calm.vrm')).uri,
    thumbnail: require('./images/calm.png'),
    defaultBackgroundColor: '#4ECDC4',
    defaultAnimationPose: 'idle',
    gradientColors: {
      dark: ['#0a1628', '#000'],
      light: ['#e8f8f5', '#d0f0f0'],
    },
    personality: 'Serene and peaceful',
    greeting: "Hello, I'm Calm. I'm here to help you find peace.",
  },
  {
    id: 'heart',
    name: 'Heart',
    description: 'Warm and caring emotional support',
    modelModule: require('./vrm/Heart.vrm'),
    asset: Asset.fromModule(require('./vrm/Heart.vrm')).uri,
    thumbnail: require('./images/heart.png'),
    defaultBackgroundColor: '#F472B6',
    defaultAnimationPose: 'idle',
    gradientColors: {
      dark: ['#2a1a28', '#120a10'],
      light: ['#fdf2f8', '#fce7f3'],
    },
    personality: 'Warm and caring',
    greeting: "Hi there! I'm Heart. I'm here to listen and support you.",
  },
  {
    id: 'mind',
    name: 'Mind',
    description: 'Intellectual and thoughtful guide',
    modelModule: require('./vrm/Mind.vrm'),
    asset: Asset.fromModule(require('./vrm/Mind.vrm')).uri,
    thumbnail: require('./images/mind.png'),
    defaultBackgroundColor: '#8B5CF6',
    defaultAnimationPose: 'idle',
    gradientColors: {
      dark: ['#1a1a2e', '#0a0a14'],
      light: ['#f5f3ff', '#ede9fe'],
    },
    personality: 'Intellectual and thoughtful',
    greeting: "Greetings. I am Mind. Let's explore ideas together.",
  },
  {
    id: 'rise',
    name: 'Rise',
    description: 'Motivational and uplifting spirit',
    modelModule: require('./vrm/Rise.vrm'),
    asset: Asset.fromModule(require('./vrm/Rise.vrm')).uri,
    thumbnail: require('./images/rise.png'),
    defaultBackgroundColor: '#F97316',
    defaultAnimationPose: 'idle',
    gradientColors: {
      dark: ['#1a1510', '#2d2218'],
      light: ['#fff7ed', '#ffedd5'],
    },
    personality: 'Motivational and uplifting',
    greeting: "Hey! I'm Rise! Ready to achieve great things together?",
  },
];

/**
 * Get avatar config by ID
 */
export function getAvatarById(id: AvatarId): AvatarConfig {
  return (
    AVATAR_MANIFEST.find((avatar) => avatar.id === id) || AVATAR_MANIFEST[0]
  );
}

/**
 * Get all avatar IDs
 */
export function getAllAvatarIds(): AvatarId[] {
  return AVATAR_MANIFEST.map((avatar) => avatar.id);
}

/**
 * Get default avatar (Airi)
 */
export function getDefaultAvatar(): AvatarConfig {
  return AVATAR_MANIFEST[0];
}
