import { Platform } from 'react-native';

export const LAYOUT = {
  // Navigation Bar
  NAV_BAR_HEIGHT: Platform.OS === 'ios' ? 84 : 66,
  NAV_BAR_PADDING_TOP: 12,
  NAV_BAR_PADDING_BOTTOM: Platform.OS === 'ios' ? 34 : 16,
  
  // Chat Input Bar
  CHAT_INPUT_HEIGHT: 56,
  CHAT_INPUT_SPACING: 12,
  
  // Glassmorphism
  GLASS_BLUR_INTENSITY: 20,
  GLASS_BORDER_WIDTH: 1,
  GLASS_BORDER_OPACITY: 0.1,
  
  // Animation Durations
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
} as const;
