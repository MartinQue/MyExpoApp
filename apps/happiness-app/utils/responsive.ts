/**
 * Responsive sizing utilities
 * Converts Figma points to device-relative sizes
 * Safe to use - handles edge cases and initialization
 */

import { Dimensions } from 'react-native';

// Figma design was done for iPhone 15 Pro (393 x 852 pts)
// We'll use this as the base for scaling
const FIGMA_BASE_WIDTH = 393;
const FIGMA_BASE_HEIGHT = 852;

/**
 * Gets screen dimensions safely
 * Always returns valid dimensions, never throws
 */
function getScreenDimensions() {
  try {
    // Check if Dimensions is available
    if (typeof Dimensions === 'undefined' || !Dimensions.get) {
      return { width: FIGMA_BASE_WIDTH, height: FIGMA_BASE_HEIGHT };
    }

    const dims = Dimensions.get('window');

    // Validate dimensions
    if (
      !dims ||
      typeof dims.width !== 'number' ||
      typeof dims.height !== 'number'
    ) {
      return { width: FIGMA_BASE_WIDTH, height: FIGMA_BASE_HEIGHT };
    }

    const { width, height } = dims;

    // Fallback if dimensions are invalid
    if (
      !width ||
      !height ||
      width === 0 ||
      height === 0 ||
      !isFinite(width) ||
      !isFinite(height)
    ) {
      return { width: FIGMA_BASE_WIDTH, height: FIGMA_BASE_HEIGHT };
    }

    return { width, height };
  } catch (error) {
    // Fallback to base dimensions if Dimensions fails
    // Don't log in production to avoid console spam
    if (__DEV__) {
      console.warn('Failed to get screen dimensions, using defaults', error);
    }
    return { width: FIGMA_BASE_WIDTH, height: FIGMA_BASE_HEIGHT };
  }
}

/**
 * Converts Figma points to device pixels
 * @param points - Size in Figma points
 * @returns Size in device pixels
 */
export function scaleSize(points: number): number {
  try {
    const { width } = getScreenDimensions();
    const scale = width / FIGMA_BASE_WIDTH;
    const result = Math.round(points * scale);
    // Ensure we never return 0 or negative for positive inputs
    return result > 0 ? result : points;
  } catch (err) {
    console.warn('scaleSize error, returning original value', err);
    return points;
  }
}

/**
 * Converts Figma points to percentage of screen width
 * @param points - Size in Figma points
 * @returns Percentage string (e.g., "50%")
 */
export function scaleWidth(points: number): string {
  try {
    const percentage = (points / FIGMA_BASE_WIDTH) * 100;
    return `${percentage}%`;
  } catch (err) {
    console.warn('scaleWidth error, returning fallback', err);
    return '100%';
  }
}

/**
 * Converts Figma points to percentage of screen height
 * @param points - Size in Figma points
 * @returns Percentage string (e.g., "50%")
 */
export function scaleHeight(points: number): string {
  try {
    const percentage = (points / FIGMA_BASE_HEIGHT) * 100;
    return `${percentage}%`;
  } catch (err) {
    console.warn('scaleHeight error, returning fallback', err);
    return '100%';
  }
}

/**
 * Gets responsive font size
 * @param points - Font size in Figma points
 * @returns Font size in device pixels
 */
export function scaleFont(points: number): number {
  try {
    const { width } = getScreenDimensions();
    const scale = width / FIGMA_BASE_WIDTH;
    const result = Math.round(points * scale);
    return result > 0 ? result : points;
  } catch (err) {
    console.warn('scaleFont error, returning original value', err);
    return points;
  }
}

// Export functions directly - no object initialization needed
// Components can use: import { scaleSize, scaleFont } from '@/utils/responsive'

// For backward compatibility with existing code using Responsive.scaleSize()
// Create a function that returns the object - nothing initialized until called
function getResponsive() {
  const dims = getScreenDimensions();
  return {
    scaleSize,
    scaleWidth,
    scaleHeight,
    scaleFont,
    width: dims.width,
    height: dims.height,
    scale: dims.width / FIGMA_BASE_WIDTH,
  };
}

// Use a getter property so it's only created when accessed
let _responsive: ReturnType<typeof getResponsive> | null = null;
export const Responsive = {
  get scaleSize() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.scaleSize;
  },
  get scaleWidth() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.scaleWidth;
  },
  get scaleHeight() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.scaleHeight;
  },
  get scaleFont() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.scaleFont;
  },
  get width() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.width;
  },
  get height() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.height;
  },
  get scale() {
    if (!_responsive) _responsive = getResponsive();
    return _responsive.scale;
  },
};
