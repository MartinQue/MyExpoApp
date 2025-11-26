/**
 * Haptics Utility - Standardized Haptic Feedback System
 *
 * Provides consistent haptic feedback across the app with
 * stronger, more satisfying feedback patterns.
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ============================================================
// Types
// ============================================================

export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error'
  | 'button'
  | 'toggle'
  | 'swipe'
  | 'send'
  | 'receive'
  | 'delete'
  | 'refresh'
  | 'scroll';

// ============================================================
// Configuration
// ============================================================

// Whether haptics are enabled globally (can be controlled by user settings)
let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function getHapticsEnabled(): boolean {
  return hapticsEnabled;
}

// ============================================================
// Core Haptic Functions
// ============================================================

/**
 * Trigger a single impact haptic
 */
async function impact(style: Haptics.ImpactFeedbackStyle): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    // Haptics may not be available on all devices
    console.debug('Haptics not available:', error);
  }
}

/**
 * Trigger a notification haptic
 */
async function notification(
  type: Haptics.NotificationFeedbackType
): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.notificationAsync(type);
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

/**
 * Trigger a selection haptic (lightest)
 */
async function selection(): Promise<void> {
  if (!hapticsEnabled) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.debug('Haptics not available:', error);
  }
}

// ============================================================
// Semantic Haptic Functions
// ============================================================

/**
 * Light tap - for subtle interactions
 */
export async function light(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium tap - standard button press
 */
export async function medium(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy tap - important actions, stronger feedback
 */
export async function heavy(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Selection feedback - for selections, toggles
 */
export async function selectionFeedback(): Promise<void> {
  await selection();
}

/**
 * Success feedback - completed action
 */
export async function success(): Promise<void> {
  await notification(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning feedback - caution needed
 */
export async function warning(): Promise<void> {
  await notification(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Error feedback - something went wrong
 */
export async function error(): Promise<void> {
  await notification(Haptics.NotificationFeedbackType.Error);
}

// ============================================================
// Context-Specific Haptic Functions
// ============================================================

/**
 * Button press feedback - satisfying tap
 */
export async function button(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Button press (primary/important) - stronger feedback
 */
export async function buttonPrimary(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Toggle switch feedback
 */
export async function toggle(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Swipe gesture feedback
 */
export async function swipe(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Message send feedback - satisfying confirmation
 */
export async function send(): Promise<void> {
  // Double tap for send - satisfying feedback
  await impact(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(async () => {
    await impact(Haptics.ImpactFeedbackStyle.Light);
  }, 100);
}

/**
 * Message receive feedback - subtle notification
 */
export async function receive(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Delete action feedback - warning pattern
 */
export async function deleteAction(): Promise<void> {
  await notification(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Pull-to-refresh feedback
 */
export async function refresh(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Scroll snap feedback (for pagination, snapping lists)
 */
export async function scrollSnap(): Promise<void> {
  await selection();
}

/**
 * Tab switch feedback
 */
export async function tabSwitch(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Voice recording start - strong confirmation
 */
export async function voiceStart(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(async () => {
    await impact(Haptics.ImpactFeedbackStyle.Medium);
  }, 80);
}

/**
 * Voice recording stop
 */
export async function voiceStop(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Long press activation
 */
export async function longPress(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Avatar/persona switch
 */
export async function avatarSwitch(): Promise<void> {
  await impact(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Image generation complete
 */
export async function imageGenerated(): Promise<void> {
  await notification(Haptics.NotificationFeedbackType.Success);
}

// ============================================================
// Pattern-Based Haptics
// ============================================================

/**
 * Triple pulse pattern - for important notifications
 */
export async function triplePulse(): Promise<void> {
  if (!hapticsEnabled) return;
  await impact(Haptics.ImpactFeedbackStyle.Light);
  setTimeout(async () => {
    await impact(Haptics.ImpactFeedbackStyle.Medium);
  }, 100);
  setTimeout(async () => {
    await impact(Haptics.ImpactFeedbackStyle.Heavy);
  }, 200);
}

/**
 * Countdown pattern - for loading/progress
 */
export async function countdown(count: number = 3): Promise<void> {
  if (!hapticsEnabled) return;
  for (let i = 0; i < count; i++) {
    setTimeout(async () => {
      await impact(Haptics.ImpactFeedbackStyle.Light);
    }, i * 300);
  }
}

/**
 * Celebration pattern - for achievements
 */
export async function celebration(): Promise<void> {
  if (!hapticsEnabled) return;
  await notification(Haptics.NotificationFeedbackType.Success);
  setTimeout(async () => {
    await impact(Haptics.ImpactFeedbackStyle.Heavy);
  }, 150);
  setTimeout(async () => {
    await impact(Haptics.ImpactFeedbackStyle.Medium);
  }, 300);
}

// ============================================================
// Unified trigger function
// ============================================================

/**
 * Trigger a haptic by type - easy unified API
 */
export async function trigger(type: HapticType): Promise<void> {
  switch (type) {
    case 'light':
      return light();
    case 'medium':
      return medium();
    case 'heavy':
      return heavy();
    case 'selection':
      return selectionFeedback();
    case 'success':
      return success();
    case 'warning':
      return warning();
    case 'error':
      return error();
    case 'button':
      return button();
    case 'toggle':
      return toggle();
    case 'swipe':
      return swipe();
    case 'send':
      return send();
    case 'receive':
      return receive();
    case 'delete':
      return deleteAction();
    case 'refresh':
      return refresh();
    case 'scroll':
      return scrollSnap();
    default:
      return medium();
  }
}

// ============================================================
// Export everything as default object too
// ============================================================

const haptics = {
  // Configuration
  setEnabled: setHapticsEnabled,
  getEnabled: getHapticsEnabled,

  // Basic
  light,
  medium,
  heavy,
  selection: selectionFeedback,
  success,
  warning,
  error,

  // Actions
  button,
  buttonPrimary,
  toggle,
  swipe,
  send,
  receive,
  delete: deleteAction,
  refresh,
  scrollSnap,
  tabSwitch,
  voiceStart,
  voiceStop,
  longPress,
  avatarSwitch,
  imageGenerated,

  // Patterns
  triplePulse,
  countdown,
  celebration,

  // Unified
  trigger,
};

export default haptics;
