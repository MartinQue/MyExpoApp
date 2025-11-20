/**
 * Grok-inspired layout constants
 * Spacing, borders, and layout measurements
 */

export const GrokLayout = {
  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
  },

  // Border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999, // Pill shape
  },

  // Container widths
  containerWidth: {
    xs: 360,
    sm: 480,
    md: 640,
    lg: 768,  // Max width for main content (matches Grok clone)
    xl: 1024,
  },

  // Input bar (from Grok clone ChatInput)
  inputBar: {
    minHeight: 56,
    maxHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 14,
    iconSize: 24,
    iconButtonSize: 40,
    borderRadius: 9999, // Pill shape
  },

  // Message bubbles
  messageBubble: {
    maxWidth: '85%' as const,
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
  },

  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },

  // Tab bar
  tabBar: {
    height: 60,
    iconSize: 24,
  },

  // Safe area padding
  safeArea: {
    top: 20,
    bottom: 20,
    horizontal: 16,
  },

  // Card layouts
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },

  // Suggestion cards (from Grok home)
  suggestionCard: {
    padding: 16,
    borderRadius: 12,
    minHeight: 80,
  },
};
