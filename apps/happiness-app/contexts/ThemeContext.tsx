// contexts/ThemeContext.tsx
// Enhanced Theme Provider with 2-tone gradients and glassmorphism support

import React, { createContext, useContext, useMemo } from 'react';
import { useUserStore } from '@/stores/userStore';

export type ThemeMode = 'light' | 'dark';

export interface GradientColors {
  start: string;
  mid: string;
  end: string;
  accent: string;
}

export interface ThemeColors {
  // Base
  background: string;
  surface: string;
  surfaceElevated: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Borders
  border: string;
  borderLight: string;
  borderStrong: string;

  // Interactive
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Glassmorphism
  glassBackground: string;
  glassBorder: string;
  glassBackgroundStrong: string;
  glassHighlight: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Card
  cardBackground: string;
  cardBorder: string;

  // Tab-specific 2-tone gradients (more creative blends)
  gradients: {
    profile: GradientColors;
    planner: GradientColors;
    library: GradientColors;
    chat: GradientColors;
    imagine: GradientColors;
  };

  // Shadows
  shadowColor: string;
  shadowOpacity: number;

  // Blur intensity
  blurIntensity: number;
}

// ============================================================
// DARK THEME - Premium deep tones with vibrant accents
// ============================================================
const darkTheme: ThemeColors = {
  background: '#000000',
  surface: '#0A0A0F',
  surfaceElevated: '#141418',

  text: '#FFFFFF',
  textSecondary: '#B0B0B5',
  textMuted: '#6B6B75',
  textInverse: '#000000',

  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderStrong: 'rgba(255, 255, 255, 0.2)',

  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  accent: '#FF0080',

  success: '#22C55E',
  warning: '#F97316',
  error: '#EF4444',
  info: '#3B82F6',

  // Glassmorphism - Premium glass effect
  glassBackground: 'rgba(15, 15, 20, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackgroundStrong: 'rgba(20, 20, 30, 0.9)',
  glassHighlight: 'rgba(255, 255, 255, 0.05)',

  inputBackground: 'rgba(30, 30, 40, 0.8)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputPlaceholder: '#6B6B75',

  cardBackground: 'rgba(20, 20, 28, 0.85)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',

  // Creative 2-tone gradients for each tab
  gradients: {
    profile: {
      start: '#1E1A28', // Deep purple-black
      mid: '#2D1F3D', // Rich purple
      end: '#3D2F4A', // Mystic purple
      accent: '#FF0080', // Hot pink
    },
    planner: {
      start: '#0F1A14', // Deep forest
      mid: '#1A2820', // Zen green-black
      end: '#2A3D32', // Emerald depth
      accent: '#10B981', // Emerald
    },
    library: {
      start: '#0F1318', // Deep ocean
      mid: '#161D26', // Midnight blue
      end: '#1E2A3A', // Ocean depth
      accent: '#4A9EFF', // Ocean blue
    },
    chat: {
      start: '#000000', // Pure black
      mid: '#080808', // Near black
      end: '#0F0F0F', // Soft black
      accent: '#FFFFFF', // Pure white
    },
    imagine: {
      start: '#1A0A30', // Deep violet
      mid: '#2E1065', // Cosmic purple
      end: '#4C1D95', // Electric violet
      accent: '#8B5CF6', // Bright violet
    },
  },

  shadowColor: '#000000',
  shadowOpacity: 0.5,
  blurIntensity: 80,
};

// ============================================================
// LIGHT THEME - Warm diary/book-like tones with subtle color accents
// ============================================================
const lightTheme: ThemeColors = {
  background: '#FAF8F5', // Warm cream/paper
  surface: '#FFFEFA', // Soft white with warmth
  surfaceElevated: '#FFFFFF',

  text: '#2D2A26', // Warm dark brown
  textSecondary: '#5C5650', // Muted brown
  textMuted: '#9A928A', // Light brown/taupe
  textInverse: '#FFFFFF',

  border: 'rgba(45, 42, 38, 0.1)',
  borderLight: 'rgba(45, 42, 38, 0.05)',
  borderStrong: 'rgba(45, 42, 38, 0.18)',

  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#6D28D9',
  accent: '#EC4899',

  success: '#16A34A',
  warning: '#EA580C',
  error: '#DC2626',
  info: '#2563EB',

  // Glassmorphism - Warm frosted glass for light mode
  glassBackground: 'rgba(255, 253, 250, 0.85)',
  glassBorder: 'rgba(45, 42, 38, 0.08)',
  glassBackgroundStrong: 'rgba(255, 253, 250, 0.95)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',

  inputBackground: 'rgba(250, 248, 245, 0.95)',
  inputBorder: 'rgba(45, 42, 38, 0.12)',
  inputPlaceholder: '#9A928A',

  cardBackground: 'rgba(255, 254, 252, 0.9)',
  cardBorder: 'rgba(45, 42, 38, 0.08)',

  // Warm diary-style gradients with subtle color accents
  gradients: {
    profile: {
      start: '#FBF8F5', // Warm cream
      mid: '#F5EDE6', // Soft beige with lavender hint
      end: '#EFE4DC', // Warm taupe
      accent: '#9F7AEA', // Soft purple
    },
    planner: {
      start: '#F9FAF5', // Cream with green tint
      mid: '#F0F5EA', // Soft sage
      end: '#E5EDD8', // Muted green
      accent: '#059669', // Emerald
    },
    library: {
      start: '#F8FAFB', // Cool cream
      mid: '#EEF4F7', // Soft blue-gray
      end: '#E3ECF2', // Muted blue
      accent: '#2563EB', // Royal blue
    },
    chat: {
      start: '#F5F0EB', // Warm paper
      mid: '#EDE5DD', // Soft beige
      end: '#E5DBD0', // Warm taupe with purple hint
      accent: '#6B5B95', // Muted purple
    },
    imagine: {
      start: '#FAF5FB', // Cream with violet
      mid: '#F3EAF5', // Soft lavender
      end: '#EBDFF0', // Light purple
      accent: '#7C3AED', // Vivid purple
    },
  },

  shadowColor: '#2D2A26',
  shadowOpacity: 0.08,
  blurIntensity: 40,
};

export interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  getGradientArray: (
    tabName: keyof ThemeColors['gradients']
  ) => readonly [string, string, string];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useUserStore();

  const value = useMemo(() => {
    const colors = theme === 'dark' ? darkTheme : lightTheme;

    // Helper to get gradient as array for LinearGradient
    const getGradientArray = (
      tabName: keyof ThemeColors['gradients']
    ): readonly [string, string, string] => {
      const gradient = colors.gradients[tabName];
      return [gradient.start, gradient.mid, gradient.end] as const;
    };

    return {
      theme,
      colors,
      isDark: theme === 'dark',
      toggleTheme,
      getGradientArray,
    };
  }, [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback for components outside provider
    const fallbackColors = darkTheme;
    return {
      theme: 'dark',
      colors: fallbackColors,
      isDark: true,
      toggleTheme: () => {},
      getGradientArray: (tabName) => {
        const gradient = fallbackColors.gradients[tabName];
        return [gradient.start, gradient.mid, gradient.end] as const;
      },
    };
  }
  return context;
}

// Export theme constants for direct use
export { darkTheme, lightTheme };
