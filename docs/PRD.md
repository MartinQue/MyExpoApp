# Happiness – Product Requirements & Gap Tracker

_Last updated: 2025-12-06_

## 1. Executive Summary

The Grok-style companion experience is **not** complete. The current build still presents low-fidelity avatars, broken chat ergonomics, inconsistent theming, and robotic audio. This document captures the definitive requirements, known gaps, and acceptance criteria so every contributor can align on what remains to be done before claiming parity with the Grok references.

### 1.1 Companion Grid (Grok Parity) – New Requirements
- Companions screen renders a 2×3 grid (5 avatars; last cell centered) with glass cards, rounded corners, drop shadows, and theme-aware gradients (deep purple/black in dark, pastel lilac/pink in light).
- Each card shows local VRM thumbnail, name, and tagline from `avatar_manifest.ts`, plus Chat (bubble icon) and Speak (waveform) buttons. Speak uses ElevenLabs first with Expo Speech fallback only.
- Selecting a card triggers haptics, shows a circular 0–100% VRM loading indicator over the blurred thumbnail, then fades into a full-screen VRM view with the companion gradient backdrop. A dismiss control returns to the grid without losing the selected avatar.
- VRM loading is strictly local (`Asset.fromModule(...).uri`); no remote fetches. The selected avatar persists across navigation; previously loaded models should not be re-fetched on simple tab switches.
- Full-screen view includes a glass chat bar (Ask Anything, mic, Call) above the 3D model; voice/chat routes to the existing chat/Alter Ego flow.
- Any region/content gating must show a graceful fallback text on the card thumbnail.

## 2. Current Reality (as observed on-device)

- **Avatar rendering**: Only static emoji/illustrations appear. No Project Airi or comparable animated characters are visible in any screen.
- **Chat ergonomics**: Chat bar sits behind the navigation bar; keyboard covers the input and refuses to dismiss cleanly.
- **Theme handling**: Dark mode still shows white backgrounds and mismatched pill/button styling; side buttons stay dark on light backgrounds.
- **Audio quality**: ElevenLabs output sounds robotic. IndexTTS is not integrated and there is no validated fallback strategy.
- **Glassmorphism**: Input bar and navbar do not share a coherent glass layer; styling differs from Grok references.
- **Navigation copy**: Tabs still reference "Ask / Imagine / Ani" patterns in some flows rather than the mandated `Ask / Alter Ego` header with "Avatar" terminology.
- **Context prompts**: Prior context prompt edits are insufficient; the system does not reliably enforce IndexTTS-first audio or Project Airi visuals when new agents join the project.

## 3. Non-Negotiables from Stakeholder

1. **High-fidelity anime avatars** built with Project Airi assets (primary) and Open-LLM-VTuber assets as fallback only.
2. **IndexTTS as the default voice pipeline**, with ElevenLabs as a secondary fallback when necessary.
3. **Navigation terminology**: Header tabs must read `Ask / Alter Ego` and the selectable cards must be referred to as "Avatars" (not "Alter Ego cards").
4. **Chat bar ergonomics**: Maintain a 12–16 px gap above the navbar, float with glassmorphism, and animate in sync with the keyboard.
5. **Theme parity**: Every surface must adapt to light/dark themes consistently, including side controls and chat surfaces.
6. **Glassmorphism**: Match Grok's layered glass aesthetic across chat input, navbar, and floating controls.
7. **Animations**: Avatars require idle/listening/speaking/thinking/celebrating states with smooth transitions and lip-sync.
8. **Stress-tested audio**: No completion claims without verifying natural prosody, latency, and fallback behaviour across multiple prompts.
9. **Context engineering hygiene**: Prompts must remind all agents about the Airi-first visual pipeline and IndexTTS-first audio directives.

## 4. Experience Requirements & Acceptance Criteria

### 4.1 Avatar Stage (Alter Ego Tab)
- Render full-body or bust-level anime characters sourced from Project Airi (primary) with animated idle states.
- Implement listening/speaking animations synchronized to audio events (visual lip-sync, glow pulses, or equivalent cues).
- Provide right-side floating action stack with theme-aware glass pills: streaks, capture, outfit, overflow controls.
- Idle screen presents a "Start talking" (or equivalent) CTA that respects space above the glass chat bar.
- Character selection modal uses "Avatar" terminology and previews high-quality art.

### 4.2 Chat Tab (Ask)
- Header: `Ask` and `Alter Ego` tabs only. No residual "Imagine" or "Ani" labels.
- Empty state replicates Grok's hero layout (logo/mascot, quick action pills, concise instructions).
- Chat bar pill: 56 px height, 28 px corner radius, glass background aligned with navbar; includes mic/attach/text controls per Grok reference.
- Keyboard handling uses safe-area insets and animation callbacks so the bar never drops behind the keyboard.
- Quick action buttons appear above the input, using glass pills that respect theme colours.

### 4.3 Keyboard & Navigation Interaction
- Adopt platform-specific keyboard avoidance (e.g., `KeyboardAvoidingView`, `useAnimatedKeyboard`, or manual inset management) to guarantee the chat bar remains visible when typing.
- Dismissing the keyboard (tap outside, swipe down) should reset layout without sticky offsets.
- Maintain a visually measurable gap (12–16 px) between the chat bar and the navbar.

### 4.4 Theme & Glass System
- Apply a shared glass token system (opacity, blur, border) to navbar, chat bar, and floating controls.
- Ensure background gradients, controls, and text colours adapt appropriately in light and dark themes.
- Validate all CTAs and icons for contrast (per WCAG 2.1 AA minimums).

### 4.5 Audio & Voice Pipeline
- Integrate IndexTTS as the primary synthesis engine, mapping avatars to distinct voice profiles when possible.
- Expose fallback logic that automatically retries with ElevenLabs (or expo-speech) upon IndexTTS failure, logging the provider used.
- Perform real-device validation to confirm natural cadence, pitch, and response latency before sign-off.
- Update recording/playback UI states so that avatar animations and button states stay in sync with audio life cycle events.

### 4.6 Context Engineering & Prompts
- Maintain a single source of truth for system prompts that emphasise: Project Airi visuals, IndexTTS-first audio, Grok-quality glass UI, keyboard ergonomics, and user frustrations (chat bar overlap, theme mismatch, robotic audio).
- Provide reusable prompt snippets for future agents to avoid re-litigating decisions.

## 5. Technical + Asset Requirements

| Area | Requirement | Notes |
| ---- | ----------- | ----- |
| Project Airi Assets | Extract VRM/Live2D models, convert for React Native (likely via WebGL, expo-three, or pixi-live2d alternative). | Investigate existing mobile-friendly renderers; consider bundling pre-rendered animation sheets if runtime integration blocks progress. |
| Open-LLM-VTuber Fallback | Prepare lower-fidelity option should Airi integration fail. | Must still deliver animated states (e.g., video sprites or WebGL). |
| IndexTTS | Review API, authentication, streaming vs. batch output. | Ensure licensing/commercial terms fit; confirm Swift package or REST endpoints for React Native integration. |
| ElevenLabs Fallback | Keep existing integration but mark as secondary. | Provide clear developer note about fallback usage and how to toggle providers for testing. |
| Keyboard Handling | Use `react-native-keyboard-controller` or `Animated` hooks if `KeyboardAvoidingView` proves insufficient. | Validate on iOS simulator and physical device. |
| Theme System | Centralise tokens (colour, blur, shadows) to avoid divergence between screens. | Consider `tailwind-rn` or design tokens if already present elsewhere. |

## 6. Reference Materials & Inspiration

- Project Airi (primary avatar source): https://github.com/moeru-ai/airi
- Open-LLM-VTuber (fallback avatar assets): https://github.com/Open-LLM-VTuber/Open-LLM-VTuber
- IndexTTS (primary audio engine): https://github.com/index-tts/index-tts
- Grok companion references:
  - https://www.youtube.com/shorts/NEJSs22UI7g
  - https://www.youtube.com/shorts/hPNpilN8gEg
  - https://www.youtube.com/watch?v=fdjPJagZeNc
- Prior art from existing repo (for comparison): `docs/GROK_UI_ANALYSIS.md`, `docs/GROK_UI_FIXES_ROUND2.md`

## 7. Risks & Unknowns

- **Mobile Live2D rendering**: Need a reliable approach that works within Expo or requires ejecting; risk of performance or licensing constraints.
- **IndexTTS mobile integration**: Assess if an SDK wrapper is required or if direct HTTP streaming is viable within Expo. Latency and file size must be evaluated.
- **Asset size management**: High-fidelity animations may balloon bundle size; consider lazy loading or CDN hosting.
- **Fallback quality**: Ensure the fallback avatar and audio experiences are still deemed acceptable if primary integrations fail temporarily.

## 8. Immediate Next Steps (Execution Order)

1. Audit runtime to confirm which components actually render on device (verify file paths under `apps/happiness-app`).
2. Produce Project Airi integration spike: evaluate rendering pipeline, prove idle animation renders on device.
3. Implement IndexTTS client wrapper with provider switching and logging; run device tests for latency and naturalness.
4. Rebuild chat layout respecting glassmorphism, theme tokens, and keyboard avoidance; validate on-device.
5. Update avatar stage with animated states, right-side controls, and renamed navigation headers.
6. Finalise context-engineering prompts and documentation so follow-up agents do not regress.

Use this PRD as the canonical checklist before closing the Grok alignment workstream. Do not mark features complete until they satisfy the acceptance criteria above on real hardware.
