// contexts/ThemeContext.tsx
// Enhanced Theme Provider with 2-tone gradients and glassmorphism support

import React, { createContext, useContext, useMemo } from 'react';
import { useUserStore } from '@/stores/userStore';
import { Colors } from '@/constants/Theme';

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
// LIGHT THEME - Soft, elegant 2-tone pastels
// ============================================================
const lightTheme: ThemeColors = {
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  text: '#1A1A1F',
  textSecondary: '#4A4A55',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  borderStrong: 'rgba(0, 0, 0, 0.15)',

  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#6D28D9',
  accent: '#EC4899',

  success: '#16A34A',
  warning: '#EA580C',
  error: '#DC2626',
  info: '#2563EB',

  // Glassmorphism - Frosted glass effect for light mode
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.85)',
  glassHighlight: 'rgba(255, 255, 255, 0.9)',

  inputBackground: 'rgba(245, 245, 250, 0.9)',
  inputBorder: 'rgba(0, 0, 0, 0.08)',
  inputPlaceholder: '#9CA3AF',

  cardBackground: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',

  // Creative 2-tone gradients for light mode
  gradients: {
    profile: {
      start: '#F8F5FF', // Soft lavender
      mid: '#EDE5FF', // Light purple
      end: '#E0D4FF', // Gentle violet
      accent: '#EC4899', // Pink
    },
    planner: {
      start: '#F0FDF4', // Mint cream
      mid: '#DCFCE7', // Light mint
      end: '#BBF7D0', // Fresh green
      accent: '#059669', // Emerald
    },
    library: {
      start: '#EFF6FF', // Ice blue
      mid: '#DBEAFE', // Sky blue
      end: '#BFDBFE', // Soft azure
      accent: '#2563EB', // Royal blue
    },
    chat: {
      start: '#FAFAFA', // Near white
      mid: '#F5F5F5', // Light gray
      end: '#EFEFEF', // Soft gray
      accent: '#1A1A1F', // Dark text
    },
    imagine: {
      start: '#FAF5FF', // Soft violet
      mid: '#F3E8FF', // Light purple
      end: '#E9D5FF', // Pale violet
      accent: '#7C3AED', // Vivid purple
    },
  },

  shadowColor: '#000000',
  shadowOpacity: 0.1,
  blurIntensity: 60,
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
