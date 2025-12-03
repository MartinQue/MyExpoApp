/**
 * Grok-inspired typography system
 * Clean, modern font sizes and weights
 */

export const GrokTypography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// Common text styles
export const textStyles = {
  h1: {
    fontSize: GrokTypography.fontSizes['4xl'],
    fontWeight: GrokTypography.fontWeights.bold,
    lineHeight: GrokTypography.lineHeights.tight,
  },
  h2: {
    fontSize: GrokTypography.fontSizes['3xl'],
    fontWeight: GrokTypography.fontWeights.bold,
    lineHeight: GrokTypography.lineHeights.tight,
  },
  h3: {
    fontSize: GrokTypography.fontSizes['2xl'],
    fontWeight: GrokTypography.fontWeights.semibold,
    lineHeight: GrokTypography.lineHeights.tight,
  },
  body: {
    fontSize: GrokTypography.fontSizes.base,
    fontWeight: GrokTypography.fontWeights.normal,
    lineHeight: GrokTypography.lineHeights.normal,
  },
  bodySmall: {
    fontSize: GrokTypography.fontSizes.sm,
    fontWeight: GrokTypography.fontWeights.normal,
    lineHeight: GrokTypography.lineHeights.normal,
  },
  caption: {
    fontSize: GrokTypography.fontSizes.xs,
    fontWeight: GrokTypography.fontWeights.normal,
    lineHeight: GrokTypography.lineHeights.normal,
  },
  button: {
    fontSize: GrokTypography.fontSizes.base,
    fontWeight: GrokTypography.fontWeights.medium,
    lineHeight: GrokTypography.lineHeights.tight,
  },
};
