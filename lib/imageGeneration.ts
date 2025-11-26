// lib/imageGeneration.ts
// AI Image Generation Service using OpenAI DALL-E 3

import { OPENAI_API_KEY } from '../constants/Config';

export interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  revisedPrompt?: string;
  model: 'dall-e-3' | 'dall-e-2';
  size: '1024x1024' | '1792x1024' | '1024x1792';
  createdAt: Date;
  style?: 'vivid' | 'natural';
}

export interface GenerationOptions {
  model?: 'dall-e-3' | 'dall-e-2';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
}

// Map aspect ratios to DALL-E sizes
export function getDALLESize(
  aspectRatio: string
): '1024x1024' | '1792x1024' | '1024x1792' {
  switch (aspectRatio) {
    case '16:9':
      return '1792x1024';
    case '9:16':
      return '1024x1792';
    case '1:1':
    default:
      return '1024x1024';
  }
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage(
  prompt: string,
  options: GenerationOptions = {}
): Promise<GeneratedImage> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const {
    model = 'dall-e-3',
    size = '1024x1024',
    style = 'vivid',
    quality = 'standard',
  } = options;

  console.log(
    `🎨 Generating image with DALL-E 3: "${prompt.substring(0, 50)}..."`
  );

  try {
    const response = await fetch(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size,
          style,
          quality,
          response_format: 'url',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DALL-E API error:', response.status, errorText);

      if (response.status === 400) {
        throw new Error(
          'Your prompt was flagged. Try a different description.'
        );
      }
      if (response.status === 429) {
        throw new Error('Rate limited. Please wait a moment and try again.');
      }
      if (response.status === 401) {
        throw new Error('API key invalid. Please check your configuration.');
      }

      throw new Error(`Generation failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data[0]) {
      throw new Error('No image generated');
    }

    const imageData = data.data[0];

    console.log('✅ Image generated successfully');

    return {
      id: `img_${Date.now()}`,
      prompt,
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt,
      model,
      size,
      createdAt: new Date(),
      style,
    };
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error;
  }
}

/**
 * Enhance a prompt for better image generation
 */
export async function enhancePrompt(userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return userPrompt;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: `You are an expert at writing prompts for AI image generation. 
Take the user's simple description and enhance it into a detailed, vivid prompt that will produce stunning results.
Add details about: lighting, atmosphere, style, composition, colors, and artistic influences.
Keep it concise but evocative. Output ONLY the enhanced prompt, nothing else.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return userPrompt;
    }

    const data = await response.json();
    const enhanced = data.choices[0]?.message?.content?.trim();

    return enhanced || userPrompt;
  } catch (error) {
    console.error('Prompt enhancement failed:', error);
    return userPrompt;
  }
}

/**
 * Get suggested prompts based on category
 */
export function getPromptSuggestions(): {
  category: string;
  prompts: string[];
}[] {
  return [
    {
      category: 'Portraits',
      prompts: [
        'A cinematic portrait in golden hour light',
        'Futuristic cyberpunk character with neon accents',
        'Elegant renaissance-style portrait with modern twist',
      ],
    },
    {
      category: 'Landscapes',
      prompts: [
        'Ethereal mountain lake at dawn with mist',
        'Bioluminescent alien forest at night',
        'Floating islands in a sunset sky',
      ],
    },
    {
      category: 'Abstract',
      prompts: [
        'Liquid metal sculpture in motion',
        'Geometric patterns merging with organic forms',
        'Dreams visualized as flowing colors',
      ],
    },
    {
      category: 'Fantasy',
      prompts: [
        'Ancient dragon guarding crystal cave',
        'Magical library in the clouds',
        'Portal to another dimension opening',
      ],
    },
  ];
}

/**
 * Style presets for quick generation
 */
export const STYLE_PRESETS = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    prefix: 'Cinematic shot, film grain, dramatic lighting,',
  },
  {
    id: 'anime',
    name: 'Anime',
    prefix: 'Anime style, Studio Ghibli inspired,',
  },
  {
    id: 'photorealistic',
    name: 'Photo',
    prefix: 'Photorealistic, 8K, detailed,',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    prefix: 'Abstract art, fluid shapes, vibrant colors,',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    prefix: 'Vintage photograph, 1970s aesthetic, warm tones,',
  },
  {
    id: 'neon',
    name: 'Neon',
    prefix: 'Neon lights, cyberpunk, glowing, night city,',
  },
];
