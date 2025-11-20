/**
 * Theme System
 * Ported from web index.css
 */

export const Colors = {
  // Base Colors
  black: '#000000',
  white: '#ffffff',

  // Grays (Approximate mapping from OKLCH to Hex for React Native)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },

  // Brand Colors (Purple/Indigo based on CSS)
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
    950: '#2e1065',
  },

  // Semantic
  success: '#22c55e', // green-500
  warning: '#f97316', // orange-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500

  // Glass/Transparency
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    heavy: 'rgba(255, 255, 255, 0.3)',
    border: 'rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.7)',
  },

  // Grok Specific
  grok: {
    background: '#000000',
    card: '#0D0F10',
    input: '#212327',
    primary: '#FFFFFF',
    secondary: '#747474',
  },

  // Tab Gradients (Deep, Premium Backgrounds)
  gradients: {
    profile: ['#1E1A28', '#3D2F4A'], // Mystic Purple
    planner: ['#1A2820', '#2F4A3D'], // Zen Green
    library: ['#1E1A28', '#2D3748'], // Deep Ocean
    chat: ['#000000', '#111111'], // Void Black
    imagine: ['#2E1065', '#4C1D95'], // Cosmic Violet
  },
  lightGradients: {
    profile: ['#E6E6FA', '#D8BFD8'], // Lavender / Thistle
    planner: ['#E0F2F1', '#B2DFDB'], // Light Teal
    library: ['#E3F2FD', '#BBDEFB'], // Light Blue
    chat: ['#F5F5F5', '#E0E0E0'], // Light Gray
    imagine: ['#F3E5F5', '#E1BEE7'], // Light Purple
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
