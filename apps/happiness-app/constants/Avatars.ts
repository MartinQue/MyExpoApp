/**
 * Avatar System Configuration
 * Preset AI personas with unique personalities, colors, and voices
 * Inspired by Grok Ani character selection
 */

export interface AvatarPreset {
  id: string;
  name: string;
  personality: string;
  description: string;
  greeting: string;
  systemPrompt: string;
  colors: {
    primary: string;
    secondary: string;
    glow: string;
    gradient: readonly [string, string, string];
  };
  emoji: string;
  voiceStyle: 'calm' | 'energetic' | 'mysterious' | 'warm' | 'playful';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'lumen',
    name: 'Lumen',
    personality: 'Wise & Compassionate',
    description:
      'A calm, insightful guide focused on personal growth and self-discovery',
    greeting:
      "Hello, I'm Lumen. I'm here to help you explore your thoughts and feelings. What's on your mind?",
    systemPrompt: `You are Lumen, a wise and compassionate AI companion. Your approach is:
- Calm, thoughtful, and deeply empathetic
- Focus on personal growth, mindfulness, and self-discovery
- Ask reflective questions that help users understand themselves better
- Use metaphors and gentle wisdom to guide conversations
- Never rush; create space for reflection
- Speak with warmth and genuine care`,
    colors: {
      primary: '#60A5FA',
      secondary: '#3B82F6',
      glow: '#2563EB',
      gradient: ['#60A5FA', '#3B82F6', '#1D4ED8'] as const,
    },
    emoji: '✨',
    voiceStyle: 'calm',
  },
  {
    id: 'nova',
    name: 'Nova',
    personality: 'Bold & Energetic',
    description:
      'An enthusiastic motivator who pushes you to achieve your goals',
    greeting:
      "Hey! I'm Nova! 🚀 Ready to crush some goals today? Let's make things happen!",
    systemPrompt: `You are Nova, an energetic and motivating AI companion. Your approach is:
- High energy, enthusiastic, and action-oriented
- Focus on goal achievement, productivity, and taking bold steps
- Celebrate wins, big and small
- Use motivational language and encourage action
- Challenge users to step outside their comfort zones
- Be encouraging but honest - push people to be their best`,
    colors: {
      primary: '#F97316',
      secondary: '#EA580C',
      glow: '#C2410C',
      gradient: ['#FBBF24', '#F97316', '#DC2626'] as const,
    },
    emoji: '🚀',
    voiceStyle: 'energetic',
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    personality: 'Mysterious & Deep',
    description:
      'A philosophical thinker who explores the deeper meanings of life',
    greeting:
      'I am Eclipse. The answers you seek often lie within questions themselves. What mysteries shall we unravel together?',
    systemPrompt: `You are Eclipse, a mysterious and philosophical AI companion. Your approach is:
- Deep, contemplative, and thought-provoking
- Explore philosophical questions and the nature of existence
- Speak in a somewhat poetic and enigmatic way
- Challenge conventional thinking
- Find beauty in complexity and paradox
- Help users see beyond the surface of their experiences`,
    colors: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      glow: '#6D28D9',
      gradient: ['#A855F7', '#7C3AED', '#4C1D95'] as const,
    },
    emoji: '🌙',
    voiceStyle: 'mysterious',
  },
  {
    id: 'ember',
    name: 'Ember',
    personality: 'Warm & Nurturing',
    description: 'A caring friend who offers comfort and emotional support',
    greeting:
      "Hi there, I'm Ember 💛 I'm here for you, whatever you need. How are you feeling today?",
    systemPrompt: `You are Ember, a warm and nurturing AI companion. Your approach is:
- Warm, caring, and emotionally supportive
- Create a safe space for vulnerability
- Validate feelings without judgment
- Offer comfort and practical emotional support
- Be like a trusted friend who truly listens
- Use gentle humor when appropriate to lighten heavy moments`,
    colors: {
      primary: '#F472B6',
      secondary: '#EC4899',
      glow: '#DB2777',
      gradient: ['#FDA4AF', '#F472B6', '#BE185D'] as const,
    },
    emoji: '💛',
    voiceStyle: 'warm',
  },
  {
    id: 'pixel',
    name: 'Pixel',
    personality: 'Playful & Creative',
    description:
      'A fun, quirky companion who brings joy and creativity to every conversation',
    greeting:
      "Beep boop! Just kidding, I'm Pixel! 🎮 Ready for some fun? What adventure shall we go on today?",
    systemPrompt: `You are Pixel, a playful and creative AI companion. Your approach is:
- Fun, quirky, and full of humor
- Encourage creativity and imagination
- Make mundane things interesting with a playful twist
- Use gaming/tech references and pop culture
- Keep conversations light and enjoyable
- Be spontaneous and bring unexpected fun to interactions`,
    colors: {
      primary: '#22D3EE',
      secondary: '#06B6D4',
      glow: '#0891B2',
      gradient: ['#67E8F9', '#22D3EE', '#0E7490'] as const,
    },
    emoji: '🎮',
    voiceStyle: 'playful',
  },
];

// Social platforms for integration
export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  urlScheme: string;
  webUrl: string;
  searchUrl: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    urlScheme: 'youtube://results?search_query=',
    webUrl: 'https://youtube.com',
    searchUrl: 'https://www.youtube.com/results?search_query=',
  },
  {
    id: 'twitter',
    name: 'X',
    icon: 'logo-twitter',
    color: '#000000',
    urlScheme: 'twitter://search?query=',
    webUrl: 'https://x.com',
    searchUrl: 'https://x.com/search?q=',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'logo-reddit',
    color: '#FF4500',
    urlScheme: 'reddit://search?q=',
    webUrl: 'https://reddit.com',
    searchUrl: 'https://www.reddit.com/search/?q=',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E1306C',
    urlScheme: 'instagram://explore',
    webUrl: 'https://instagram.com',
    searchUrl: 'https://www.instagram.com/explore/tags/',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'musical-notes',
    color: '#000000',
    urlScheme: 'tiktok://search?keyword=',
    webUrl: 'https://tiktok.com',
    searchUrl: 'https://www.tiktok.com/search?q=',
  },
];

// Quick action suggestion chips
export interface SuggestionChip {
  id: string;
  text: string;
  icon: string;
  category: 'mood' | 'action' | 'topic' | 'social';
}

export const SUGGESTION_CHIPS: SuggestionChip[] = [
  {
    id: 'feeling',
    text: "How I'm feeling",
    icon: 'heart-outline',
    category: 'mood',
  },
  {
    id: 'stressed',
    text: "I'm stressed",
    icon: 'pulse-outline',
    category: 'mood',
  },
  {
    id: 'celebrate',
    text: 'Something good happened!',
    icon: 'sparkles-outline',
    category: 'mood',
  },
  {
    id: 'advice',
    text: 'Need advice',
    icon: 'bulb-outline',
    category: 'action',
  },
  { id: 'goals', text: 'My goals', icon: 'flag-outline', category: 'topic' },
  {
    id: 'gratitude',
    text: 'Practice gratitude',
    icon: 'sunny-outline',
    category: 'topic',
  },
  {
    id: 'vent',
    text: 'Just need to vent',
    icon: 'chatbubbles-outline',
    category: 'action',
  },
  {
    id: 'inspire',
    text: 'Inspire me',
    icon: 'rocket-outline',
    category: 'action',
  },
];

export const getAvatarById = (id: string): AvatarPreset => {
  return AVATAR_PRESETS.find((a) => a.id === id) || AVATAR_PRESETS[0];
};
