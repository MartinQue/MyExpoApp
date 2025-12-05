/**
 * Live2D Avatar System
 *
 * Full Live2D avatar integration with:
 * - Multiple avatar models (6 available)
 * - Expression system (idle, happy, thinking, listening, speaking, surprised, sad)
 * - Lip sync animation synchronized with ElevenLabs TTS
 * - User avatar selection UI
 * - WebView-based rendering with PIXI.js
 */

export { default as Live2DAvatar } from './Live2DAvatar';
export type { Live2DAvatarRef, Live2DExpression, Live2DModel } from './Live2DAvatar';

export { default as AvatarController } from './AvatarController';
export type { AvatarState } from './AvatarController';

export { default as AvatarSelector } from './AvatarSelector';
