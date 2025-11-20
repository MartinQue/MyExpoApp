# Product Requirements Document (PRD)

## Happiness AI - The Multi-Agent Companion

**Version:** 3.0 (The "Grok-Glass" Edition)
**Status:** Production Baseline
**Last Updated:** November 2025

---

## 1. Vision & Philosophy

**Happiness AI** is not just a chatbot; it is a proactive, multi-agent life companion. It orchestrates 8 specialist agents (Finance, Health, Relationships, etc.) behind a single, empathetic persona called **"Alter Ego"**.

**The Design Philosophy:**
"Premium Intelligence." The app must feel as smart as it is beautiful. We are adopting a **Grok-inspired UI** characterized by:

- **Deep Black Backgrounds:** (#000000) for infinite contrast.
- **Glassmorphism:** High-blur, translucent elements that layer over content, giving a sense of depth and context.
- **Tactile Interactivity:** Every touch has haptic feedback; every transition is fluid.
- **Minimalism:** No clutter. Content breathes. Typography is crisp (SF Pro/Inter).

---

## 2. Core Architecture

The application is built on a robust, scalable stack designed for real-time AI interaction.

- **Frontend:** React Native (Expo SDK 52+)
- **Language:** TypeScript
- **State Management:** Zustand (Global Store)
- **Navigation:** Expo Router (File-based routing)
- **Backend:** Supabase (Auth, Database, Vector Store)
- **AI Orchestration:** LangGraph (Multi-Agent Supervisor)
- **LLM:** OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet
- **Voice:** OpenAI Realtime API / Expo Speech
- **Media:** Expo AV (Video), Expo Image Picker

---

## 3. UI/UX Specifications (The "Hybrid" Standard)

**Design Philosophy:**
A fusion of **Figma's Color Identity** and **Grok's Glassmorphism**.

- **Base Layer:** Distinct, deep gradients specific to each tab (not just pure black).
- **Overlay Layer:** Grok-style Glassmorphism (Blur 80+, translucent borders) for all interactive elements (Nav, Headers, Inputs).
- **Interaction:** iOS-style spring animations and haptics.

### 3.1 Dynamic Color Palette (Per Tab)

The app changes its ambient atmosphere based on the active tab.

| Tab                | Primary Hue       | Gradient Start | Gradient End | Accent              |
| :----------------- | :---------------- | :------------- | :----------- | :------------------ |
| **Home (Profile)** | **Mystic Purple** | `#1E1A28`      | `#3D2F4A`    | `#FF0080` (Pink)    |
| **Planner**        | **Zen Green**     | `#1A2820`      | `#2F4A3D`    | `#10B981` (Emerald) |
| **Library**        | **Deep Ocean**    | `#1E1A28`      | `#2D3748`    | `#4A9EFF` (Blue)    |
| **Chat**           | **Void Black**    | `#000000`      | `#111111`    | `#FFFFFF` (White)   |
| **Imagine**        | **Cosmic Violet** | `#2E1065`      | `#4C1D95`    | `#8B5CF6` (Violet)  |

### 3.2 The "Opposite Hue" Rule

- **Main View:** Dark, rich, immersive gradients.
- **Settings/Details:** When drilling down into settings or specific details, the theme flips to a **Light Hue** variant of the active tab's color (e.g., Pale Green for Planner Settings), creating a "Paper" feel for reading/configuration.

### 3.3 Glassmorphism Rules (Grok Style)

- **Blur:** `intensity={80}` (using `expo-blur`).
- **Border:** 1px solid `rgba(255, 255, 255, 0.1)`.
- **Shape:** "Pill" shapes for inputs/buttons (`borderRadius: 9999`), "Squircle" for cards (`borderRadius: 24`).
- **Layering:** Content scrolls _behind_ glass headers and tab bars, picking up the colors of the content below.

### 3.4 Typography

- **Headings:** Bold, tight tracking.
- **Body:** Regular, readable line height (1.5).
- **Monospace:** Used for code snippets or data values.

---

## 4. Feature Requirements (The 5 Pillars)

- **Rich Expandable Cards**:
  - **Finance/Market**: Displays a main image in collapsed view. Expands to show live graphs, "Must Know" news, trending topics, and expert predictions.
  - **Fitness/Gym**: Expands to show "Remember Why You Started" memoires, "Before vs. Goal" image comparisons, and playable workout video snippets.
- **Visual Cues**: Contextually relevant cards have a subtle glow and "Suggested" badge.

- **Daily Review**:
  - A summary card at the bottom of the feed inviting the user to review their daily progress, energy levels, and focus time.

### 💬 Tab 2: Chat (The "Alter Ego")

_The primary interface for interaction._

- **UI:** A clean, message-focused interface.
- **"Alter Ego" Mode:** Swipe LEFT to reveal the 3D/Animated Avatar (The "Soul").
- **Input Bar:** A floating glass pill containing:
  - **Attachment (Left):** Opens a glass sheet for Photos, Camera, Documents.
  - **Text Input (Center):** Multiline, auto-expanding.
  - **Voice/Send (Right):** Dynamic button. Mic icon for voice mode, Arrow for send.
- **Suggestion Chips:** Context-aware pills above the input (e.g., "Plan my day", "Generate image").
- **Voice Mode:** Real-time, interruptible voice conversation (like a phone call).

### 🎨 Tab 3: Imagine (The Creative Studio)

_A space for generative media._

- **Image Gen:** Text-to-Image creation using DALL-E 3 / Flux.
- **Video Gen:** Image-to-Video or Text-to-Video using Runway/Luma.
- **Gallery:** A masonry grid of generated assets.
- **Paywall:** Credit-based system for premium generations.

### 📚 Tab 4: Library (The Knowledge Vault)

_The user's external brain._

- **Unified Search:** Search across Notes, Images, Videos, and Chat History.
- **Smart Filters:** "Video", "Image", "Voice Notes", "Links".
- **Inline Playback:** Videos and Audio play directly in the feed (no full-screen modal required).
- **Transcription:** Voice notes are automatically transcribed and searchable.

### 📅 Tab 5: Planner (The Action Center)

_Where talk turns into action._

- **Goal Tracking:** Visual progress bars for long-term goals.
- **Milestones:** Break down goals into actionable steps.
- **AI Planning:** "Create a plan for X" automatically generates a timeline with milestones.
- **Gamification:** Streaks and achievements for completing tasks.

---

## 5. Technical Constraints & Standards

- **Performance:** 60 FPS animations. No JS-driven animations on the UI thread (use `Reanimated`).
- **Offline First:** App should load cached content immediately.
- **Safety:** All AI outputs must pass through a safety filter (Crisis Detection).
- **Privacy:** User data is encrypted. RAG memory is user-scoped.

---

## 6. Future Roadmap

- **Desktop/Web Version:** Sync state across devices.
- **Wearable Integration:** WatchOS companion for quick voice notes.
- **Local LLM:** Run small models on-device for privacy.
