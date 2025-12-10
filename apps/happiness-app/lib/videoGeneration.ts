// lib/videoGeneration.ts
// AI Video Generation Service
// Supports multiple providers: Runway, Luma AI, OpenAI Sora (when available)


// ========================================
// Types
// ========================================

export type VideoProvider = 'runway' | 'luma' | 'sora' | 'pika';

export interface VideoGenerationOptions {
  provider?: VideoProvider;
  duration?: number; // seconds (5-10 for most providers)
  aspectRatio?: '16:9' | '9:16' | '1:1';
  quality?: 'standard' | 'high';
  fps?: 24 | 30 | 60;
}

export interface GeneratedVideo {
  id: string;
  provider: VideoProvider;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceImage?: string; // For image-to-video
}

export interface VideoProviderStatus {
  id: VideoProvider;
  name: string;
  description: string;
  available: boolean;
  comingSoon: boolean;
  pricePerGeneration?: string;
  maxDuration: number;
  features: string[];
}

// ========================================
// Provider Configuration
// ========================================

export const VIDEO_PROVIDERS: VideoProviderStatus[] = [
  {
    id: 'runway',
    name: 'Runway Gen-3',
    description: 'State-of-the-art text and image to video',
    available: false,
    comingSoon: true,
    pricePerGeneration: '$0.50',
    maxDuration: 10,
    features: [
      'Text-to-Video',
      'Image-to-Video',
      'Motion Brush',
      'Camera Control',
    ],
  },
  {
    id: 'luma',
    name: 'Luma Dream Machine',
    description: 'Fast, high-quality video generation',
    available: false,
    comingSoon: true,
    pricePerGeneration: '$0.30',
    maxDuration: 5,
    features: ['Text-to-Video', 'Image-to-Video', 'Quick Generation'],
  },
  {
    id: 'sora',
    name: 'OpenAI Sora',
    description: 'Next-gen realistic video generation',
    available: false,
    comingSoon: true,
    pricePerGeneration: 'TBD',
    maxDuration: 60,
    features: ['Text-to-Video', 'Ultra-realistic', 'Extended Duration'],
  },
  {
    id: 'pika',
    name: 'Pika Labs',
    description: 'Creative video effects and animation',
    available: false,
    comingSoon: true,
    pricePerGeneration: '$0.25',
    maxDuration: 5,
    features: ['Text-to-Video', 'Lip Sync', 'Sound Effects'],
  },
];

// ========================================
// Video Generation Functions
// ========================================

/**
 * Generate video from text prompt
 * Currently returns a mock response - will be connected to real APIs when available
 */
export async function generateVideoFromText(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<GeneratedVideo> {
  const { provider = 'runway', duration = 5 } = options;

  const providerInfo = VIDEO_PROVIDERS.find((p) => p.id === provider);

  if (!providerInfo || !providerInfo.available) {
    throw new Error(
      `${
        providerInfo?.name || provider
      } video generation is coming soon! Stay tuned for updates.`
    );
  }

  console.log(
    `🎬 Generating video with ${provider}: "${prompt.substring(0, 50)}..."`
  );

  // This will be replaced with actual API calls when providers are integrated
  // For now, return a placeholder response
  return {
    id: `vid_${Date.now()}`,
    provider,
    prompt,
    videoUrl: '', // Will be populated by actual API
    duration,
    createdAt: new Date(),
    status: 'pending',
  };
}

/**
 * Generate video from image (Image-to-Video)
 * Animates a static image into a short video
 */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<GeneratedVideo> {
  const { provider = 'runway', duration = 5 } = options;

  const providerInfo = VIDEO_PROVIDERS.find((p) => p.id === provider);

  if (!providerInfo || !providerInfo.available) {
    throw new Error(
      `${
        providerInfo?.name || provider
      } video generation is coming soon! Stay tuned for updates.`
    );
  }

  console.log(`🎬 Generating video from image with ${provider}`);

  return {
    id: `vid_${Date.now()}`,
    provider,
    prompt,
    videoUrl: '',
    sourceImage: imageUrl,
    duration,
    createdAt: new Date(),
    status: 'pending',
  };
}

/**
 * Check the status of a video generation job
 */
export async function checkVideoStatus(
  videoId: string,
  provider: VideoProvider
): Promise<GeneratedVideo | null> {
  // Placeholder for status checking
  // Will poll the provider's API to check job status
  console.log(`Checking status for video ${videoId} on ${provider}`);
  return null;
}

/**
 * Get available video providers
 */
export function getAvailableProviders(): VideoProviderStatus[] {
  return VIDEO_PROVIDERS;
}

/**
 * Get provider by ID
 */
export function getProvider(
  id: VideoProvider
): VideoProviderStatus | undefined {
  return VIDEO_PROVIDERS.find((p) => p.id === id);
}

// ========================================
// Runway API Integration (Preparation)
// ========================================

/**
 * Runway Gen-3 Alpha Integration
 * Documentation: https://docs.runwayml.com/
 *
 * To enable:
 * 1. Get API key from https://runwayml.com/
 * 2. Add RUNWAY_API_KEY to constants/Config.ts
 * 3. Uncomment and implement the functions below
 */

// const RUNWAY_API_KEY = ''; // Add to Config.ts

/*
async function generateWithRunway(
  prompt: string,
  options: VideoGenerationOptions
): Promise<GeneratedVideo> {
  const response = await fetch('https://api.runwayml.com/v1/video/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RUNWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      duration: options.duration || 5,
      aspect_ratio: options.aspectRatio || '16:9',
    }),
  });

  const data = await response.json();
  
  return {
    id: data.id,
    provider: 'runway',
    prompt,
    videoUrl: data.video_url,
    thumbnailUrl: data.thumbnail_url,
    duration: data.duration,
    createdAt: new Date(),
    status: data.status,
  };
}
*/

// ========================================
// Luma AI Integration (Preparation)
// ========================================

/**
 * Luma Dream Machine Integration
 * Documentation: https://lumalabs.ai/dream-machine/api
 *
 * To enable:
 * 1. Get API key from https://lumalabs.ai/
 * 2. Add LUMA_API_KEY to constants/Config.ts
 * 3. Uncomment and implement the functions below
 */

// const LUMA_API_KEY = ''; // Add to Config.ts

/*
async function generateWithLuma(
  prompt: string,
  options: VideoGenerationOptions
): Promise<GeneratedVideo> {
  const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LUMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: options.aspectRatio || '16:9',
      loop: false,
    }),
  });

  const data = await response.json();
  
  return {
    id: data.id,
    provider: 'luma',
    prompt,
    videoUrl: data.video?.url || '',
    thumbnailUrl: data.thumbnail?.url,
    duration: 5, // Luma generates 5-second clips
    createdAt: new Date(data.created_at),
    status: data.state,
  };
}
*/

// ========================================
// Video Style Presets
// ========================================

export const VIDEO_STYLE_PRESETS = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    promptPrefix: 'Cinematic film style, movie quality, dramatic lighting,',
    icon: '🎬',
  },
  {
    id: 'anime',
    name: 'Anime',
    promptPrefix: 'Anime style animation, Studio Ghibli inspired,',
    icon: '✨',
  },
  {
    id: 'realistic',
    name: 'Realistic',
    promptPrefix: 'Photorealistic, 4K quality, natural movement,',
    icon: '📹',
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    promptPrefix: 'Fantasy world, magical, ethereal atmosphere,',
    icon: '🧙',
  },
  {
    id: 'scifi',
    name: 'Sci-Fi',
    promptPrefix: 'Futuristic, sci-fi aesthetic, advanced technology,',
    icon: '🚀',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    promptPrefix: 'Old film grain, nostalgic, 1970s aesthetic,',
    icon: '📼',
  },
];

// ========================================
// Video Prompt Suggestions
// ========================================

export function getVideoPromptSuggestions(): {
  category: string;
  prompts: string[];
}[] {
  return [
    {
      category: 'Nature',
      prompts: [
        'A serene lake at sunrise with mist rising',
        'Ocean waves crashing on rocky cliffs in slow motion',
        'Northern lights dancing over a snowy mountain',
      ],
    },
    {
      category: 'Abstract',
      prompts: [
        'Flowing liquid metal morphing into shapes',
        'Colorful particles swirling in space',
        'Geometric patterns transforming seamlessly',
      ],
    },
    {
      category: 'Urban',
      prompts: [
        'Neon-lit cyberpunk city street at night',
        'Time-lapse of clouds moving over a skyline',
        'Rain falling on a city street with reflections',
      ],
    },
    {
      category: 'Fantasy',
      prompts: [
        'Dragon flying through golden clouds at sunset',
        'Magical forest with glowing fireflies',
        'Ancient temple emerging from the mist',
      ],
    },
  ];
}

// ========================================
// Utility Functions
// ========================================

/**
 * Estimate generation time based on provider and options
 */
export function estimateGenerationTime(
  provider: VideoProvider,
  options: VideoGenerationOptions = {}
): number {
  const baseTimes: Record<VideoProvider, number> = {
    runway: 120, // 2 minutes
    luma: 60, // 1 minute
    sora: 180, // 3 minutes (estimated)
    pika: 90, // 1.5 minutes
  };

  let time = baseTimes[provider] || 120;

  // Adjust for quality
  if (options.quality === 'high') {
    time *= 1.5;
  }

  // Adjust for duration
  if (options.duration && options.duration > 5) {
    time *= options.duration / 5;
  }

  return Math.round(time);
}

/**
 * Calculate estimated cost for video generation
 */
export function estimateCost(
  provider: VideoProvider,
  options: VideoGenerationOptions = {}
): string {
  const baseCosts: Record<VideoProvider, number> = {
    runway: 0.5,
    luma: 0.3,
    sora: 1.0, // Estimated
    pika: 0.25,
  };

  let cost = baseCosts[provider] || 0.5;

  // Adjust for quality
  if (options.quality === 'high') {
    cost *= 2;
  }

  // Adjust for duration
  if (options.duration && options.duration > 5) {
    cost *= options.duration / 5;
  }

  return `$${cost.toFixed(2)}`;
}
