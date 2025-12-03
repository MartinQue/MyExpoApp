/**
 * Happiness Design System
 * Premium UI matching Manus.AI, Claude, Arc quality
 * Created: 2025-10-06
 */

// ============================================================================
// GRADIENTS - Grok Dark Theme
// ============================================================================

export const GRADIENTS = {
  // alter_ego identity - dark, mysterious, sophisticated
  primary: {
    colors: ['#1a1a1a', '#2a2a2a', '#333333'],
    locations: [0, 0.5, 1],
    angle: 135,
  },

  // Voice listening - deep blue (focused attention)
  listening: {
    colors: ['#1a237e', '#283593', '#3949ab'],
    locations: [0, 0.5, 1],
    angle: 180,
  },

  // Processing/thinking - dark purple
  thinking: {
    colors: ['#2d1b69', '#4c1d95', '#5b21b6'],
    locations: [0, 0.5, 1],
    angle: 90,
  },

  // Speaking - dark green (calm, confident)
  speaking: {
    colors: ['#064e3b', '#065f46', '#047857'],
    locations: [0, 0.5, 1],
    angle: 180,
  },

  // Idle - subtle dark gradient
  idle: {
    colors: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
    locations: [0, 0.5, 1],
    angle: 180,
  },

  // Processing (alias for thinking)
  processing: {
    colors: ['#2d1b69', '#4c1d95', '#5b21b6'],
    locations: [0, 0.5, 1],
    angle: 90,
  },

  // Evening/Night mode
  evening: {
    colors: ['#0a0a0a', '#1a1a1a', '#2a2a2a'],
    locations: [0, 0.5, 1],
    angle: 135,
  },

  // Success/wellness
  success: {
    colors: ['#064e3b', '#065f46', '#047857'],
    locations: [0, 0.5, 1],
    angle: 135,
  },

  // Alert/Warning (subtle red)
  alert: {
    colors: ['#7f1d1d', '#991b1b', '#b91c1c'],
    locations: [0, 0.5, 1],
    angle: 135,
  },
};

// ============================================================================
// COLORS
// ============================================================================

export const COLORS = {
  // Backgrounds (Dark Theme)
  background: '#000000', // Pure black background
  surface: '#1a1a1a', // Card surfaces
  surfaceElevated: '#2a2a2a', // Elevated cards
  overlay: 'rgba(0, 0, 0, 0.8)', // Modal overlay

  // Text (White on dark)
  text: {
    primary: '#ffffff', // Main text (white)
    secondary: '#a0a0a0', // Secondary text (light gray)
    tertiary: '#666666', // Tertiary text (medium gray)
    disabled: '#4a4a4a', // Disabled text (dark gray)
    inverse: '#000000', // Inverse text (black)
  },

  // Borders (Dark theme)
  border: {
    light: '#333333', // Light borders
    medium: '#4a4a4a', // Medium borders
    strong: '#666666', // Strong borders
  },

  // Brand (Grok-inspired)
  brand: {
    primary: '#4A90E2', // Primary blue
    secondary: '#E94B3C', // Secondary red
    light: '#87CEEB', // Light blue
    dark: '#1a237e', // Dark blue
  },

  // Semantic (matching dark theme)
  success: '#4CAF50', // Success green
  warning: '#FF9800', // Warning orange
  error: '#F44336', // Error red
  info: '#2196F3', // Info blue

  // Waveform colors (blue theme for voice)
  waveform: [
    '#4A90E2', // Deep blue
    '#87CEEB', // Sky blue
    '#B4D7F1', // Light blue
    '#87CEEB', // Sky blue
    '#4A90E2', // Deep blue
    '#4A90E2', // Deep blue
    '#87CEEB', // Sky blue
  ],
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  // Display
  hero: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
    letterSpacing: -1.2,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Labels
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.3,
  },

  // Voice UI
  voiceState: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: '#6b7190',
  },
  transcript: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#1B1F33',
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },

  // Colored shadows for voice states
  voice: {
    listening: {
      shadowColor: '#4A90E2',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    processing: {
      shadowColor: '#8B5CF6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    speaking: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    idle: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const ANIMATIONS = {
  // Spring configurations
  spring: {
    gentle: { damping: 20, stiffness: 150 },
    bouncy: { damping: 10, stiffness: 200 },
    snappy: { damping: 15, stiffness: 300 },
  },

  // Timing configurations
  timing: {
    fast: { duration: 200 },
    normal: { duration: 300 },
    slow: { duration: 500 },
    breathe: { duration: 2000 },
    pulse: { duration: 1500 },
  },

  // Delays
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  },

  // Easing curves
  easing: {
    // Standard ease-in-out
    standard: [0.4, 0.0, 0.2, 1],
    // Decelerate
    decelerate: [0.0, 0.0, 0.2, 1],
    // Accelerate
    accelerate: [0.4, 0.0, 1, 1],
    // Sharp
    sharp: [0.4, 0.0, 0.6, 1],
  },
};

// ============================================================================
// VOICE UI CONSTANTS
// ============================================================================

export const VOICE = {
  // Orb dimensions
  orb: {
    size: 180, // Larger than before (was 140)
    borderRadius: 90,
  },

  // Waveform
  waveform: {
    barCount: 7, // More bars (was 5)
    barWidth: 4,
    barGap: 4,
    minHeight: 8,
    maxHeight: 56,
    borderRadius: 2,
  },

  // Animation durations
  transitions: {
    stateChange: 400, // ms
    waveformUpdate: 100, // ms
    breatheCycle: 3000, // ms
  },

  // Audio thresholds
  audio: {
    silenceThreshold: -40, // dB
    shortPause: 800, // ms
    longPause: 1800, // ms
  },
};

// ============================================================================
// HAPTIC PATTERNS
// ============================================================================

export const HAPTICS = {
  // Feedback styles (expo-haptics)
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',

  // Context-specific patterns
  patterns: {
    startListening: 'medium',
    stopListening: 'light',
    startSpeaking: 'light',
    error: 'heavy',
    success: 'medium',
    buttonPress: 'light',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get gradient configuration for a given state
 */
export function getGradient(state: keyof typeof GRADIENTS) {
  return GRADIENTS[state] || GRADIENTS.idle;
}

/**
 * Get shadow configuration for voice state
 */
export function getVoiceShadow(
  state: 'idle' | 'listening' | 'processing' | 'speaking'
) {
  return SHADOWS.voice[state];
}

/**
 * Get typography style
 */
export function getTypography(variant: keyof typeof TYPOGRAPHY) {
  return TYPOGRAPHY[variant];
}

/**
 * Apply spacing value
 */
export function spacing(key: keyof typeof SPACING) {
  return SPACING[key];
}

/**
 * Apply border radius
 */
export function radius(key: keyof typeof RADIUS) {
  return RADIUS[key];
}

/**
 * Get color value from nested object
 */
export function color(path: string) {
  const keys = path.split('.');
  let value: any = COLORS;
  for (const key of keys) {
    value = value?.[key];
  }
  return value || COLORS.text.primary;
}
