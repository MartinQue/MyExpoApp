# Product Requirements Document (PRD)

## Happiness AI - The Multi-Agent Companion

**Version:** 4.0 (Enhanced Production Release)
**Status:** Production Ready - Pending UI Verification
**Last Updated:** November 26, 2025

---

## 1. Vision & Philosophy

**Happiness AI** is not just a chatbot; it is a proactive, multi-agent life companion. It orchestrates 8 specialist agents (Finance, Health, Relationships, etc.) behind a single, empathetic persona called **"Alter Ego"**.

**The Design Philosophy:**
"Premium Intelligence." The app must feel as smart as it is beautiful. We are adopting a **Grok-inspired UI** characterized by:

- **Deep Black Backgrounds:** (#000000) for infinite contrast.
- **Glassmorphism:** High-blur, translucent elements that layer over content, giving a sense of depth and context.
- **Tactile Interactivity:** Every touch has haptic feedback; every transition is fluid.
- **Minimalism:** No clutter. Content breathes. Typography is crisp (SF Pro/Inter).
- **Emotional Engagement:** Every tab features images or video snippets that communicate emotionally

---

## 2. Core Architecture

The application is built on a robust, scalable stack designed for real-time AI interaction.

- **Frontend:** React Native (Expo SDK 54+)
- **Language:** TypeScript (0 errors)
- **State Management:** Zustand (Global Store)
- **Navigation:** Expo Router (File-based routing)
- **Backend:** Supabase (Auth, Database, Vector Store)
- **AI Orchestration:** LangGraph (Multi-Agent Supervisor)
- **LLM:** OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet
- **Voice:** OpenAI Whisper API (Transcription) + expo-av (Recording)
- **Text-to-Speech:** Expo Speech
- **Image Generation:** OpenAI DALL-E 3 / DALL-E 2
- **Media:** Expo AV (Video), Expo Image Picker
- **Animations:** react-native-reanimated, moti

---

## 3. UI/UX Specifications (The "Hybrid" Standard)

**Design Philosophy:**
A fusion of **Figma's Color Identity** and **Grok's Glassmorphism**.

- **Base Layer:** Distinct, deep gradients specific to each tab (not just pure black).
- **Overlay Layer:** Grok-style Glassmorphism (Blur 60-80, translucent borders) for all interactive elements.
- **Interaction:** iOS-style spring animations and haptics.
- **Theme Support:** Full light/dark mode with ThemeContext

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
- **Settings/Details:** When drilling down into settings or specific details, the theme flips to a **Light Hue** variant of the active tab's color.

### 3.3 Glassmorphism Rules (Grok Style)

- **Blur:** `intensity={60-80}` (using `expo-blur`).
- **Border:** 1px solid `rgba(255, 255, 255, 0.1)`.
- **Shape:** "Pill" shapes for inputs/buttons (`borderRadius: 9999`), "Squircle" for cards (`borderRadius: 24`).
- **Layering:** Content scrolls _behind_ glass headers and tab bars.
- **REQUIRED ON:** All modals, sheets, headers, input bars, cards, and overlays

### 3.4 Typography

- **Headings:** Bold, tight tracking (SF Pro Display)
- **Body:** Regular, readable line height (1.5)
- **Monospace:** Used for code snippets or data values

### 3.5 Haptic Feedback Standards

All interactive elements must use consistent haptic feedback via `lib/haptics.ts`:

| Action Type  | Haptic Style         | Function              |
| :----------- | :------------------- | :-------------------- |
| Button tap   | Light                | `haptics.light()`     |
| Send message | Medium               | `haptics.send()`      |
| Success      | Success Notification | `haptics.success()`   |
| Error        | Error Notification   | `haptics.error()`     |
| Warning      | Warning              | `haptics.warning()`   |
| Selection    | Selection            | `haptics.selection()` |

---

## 4. Feature Requirements (The 5 Pillars)

### 🏠 Tab 1: Profile (Home)

_The user's emotional dashboard._

**Requirements:**

- **Context-Aware Greeting:** Time-based (Morning/Afternoon/Evening/Night) + Day awareness
- **Scroll Animations:** Parallax effects and fade animations on scroll (satisfying micro-interactions)
- **Quick Actions:** Large, tappable cards for common actions
- **Emotional Imagery:** Hero images/video snippets that communicate emotionally
- **Settings Access:** Responsive menu button leading to full Settings page
- **Personalization:** Reflects user preferences, goals, and recent activity

**Settings Page (Full Implementation):**

- Profile editing (name, avatar, preferences)
- Theme toggle (light/dark)
- Notification preferences
- Privacy settings
- Data export
- Account management
- All buttons must be functional (even if dummy for now)

### 💬 Tab 2: Chat (Ask & Alter Ego)

_The primary interface for AI interaction._

**Two Sub-Screens (Swipeable):**

#### Ask Screen

- **Context-Aware AI:** Reflects place, time, day of year, everything learned from user
- **Dynamic Suggestions:** Time-based prompts (Morning routine, Evening wind-down, etc.)
- **Voice Input:** Tap and hold mic → Records → Release → Transcribes → Sends
- **Intelligent Conversation Starters:** Based on user history, goals, and context
- **Agent Integration:** Routes to specialist agents (Finance, Health, etc.) automatically

#### Alter Ego Screen

- **3D/Animated Avatar:** Speaking visualization
- **Pure Privacy:** No share button - a safe space for user to open up
- **Voice Sync:** Speak button state syncs between Ask and Alter Ego screens
- **All Agents Connected:** Finance, Health, Relationships, Wellness, Learning, etc.

**Voice System Requirements:**

- Uses OpenAI Whisper API for transcription
- Recording via expo-av with proper iOS permissions
- VoiceContext for shared state across screens
- Extremely responsive - listens and can speak back
- Error handling with clear user feedback

**Input Bar (Glassmorphism Required):**

- Attachment button (opens glass sheet with Photos, Camera, Documents)
- Text input (multiline, auto-expanding)
- Voice/Send button (dynamic)
- All elements use BlurView

### 🎨 Tab 3: Imagine (Creative Studio)

_A space for generative media - Grok-style UI._

**UI Requirements:**

- **Model Selector (Dropdown):** DALL-E 3, DALL-E 2, Flux Pro (coming soon), Midjourney (coming soon)
- **Quality Presets:** Fast, Balanced, HD
- **Style Presets:** Photorealistic, Anime, Digital Art, etc.
- **Aspect Ratio Selection:** Square (1:1), Wide (16:9), Tall (9:16)
- **Credits System:** Badge showing remaining credits (∞ for Pro)
- **Pro Upgrade:** Visible upgrade path

**Generation Modes:**

- **Image:** Text-to-Image via DALL-E
- **Video:** Coming soon (scaffolding in place for Runway/Luma integration)
- **Multi-Image:** Combine reference images (Pro feature)

**Gallery:**

- Masonry grid of generated assets
- Recent generations preview
- Full gallery access

**Hero Section:**

- Example Video/Image generations
- Placeholder content for launch

### 📚 Tab 4: Library (Knowledge Vault)

_The user's external brain - Instagram-style grid._

**Requirements:**

- **Visual Grid:** Instagram-style masonry layout
- **Personal Tab:** Photos, Videos, Voice memos
- **Notes Tab:** Meeting notes with sentiment analysis
- **Animated Items:** MotiView for staggered entrance animations
- **Search:** Full-text search across all media
- **Filters:** By type (Photos, Videos, Audio), By goal
- **Inline Playback:** Videos play in feed
- **Transcription:** Voice notes auto-transcribed

**Detail Modal:**

- Full media preview
- Metadata (date, duration)
- Sentiment analysis (for notes)
- Action items extraction
- Tags and linked goals
- Edit/Share/Delete actions

### 📅 Tab 5: Planner (Action Center)

_Where talk turns into action._

**Requirements:**

- **Visual Progress Bars:** For long-term goals
- **Milestone Breakdown:** Actionable steps with checkboxes
- **AI Planning:** "Create a plan for X" auto-generates timeline
- **Gamification:** Streaks, achievements, badges
- **Theme Integration:** Uses planner gradient colors
- **Easy Input:** Quick add for tasks and goals
- **Progress Updates:** Simple tap to update progress

---

## 5. Cross-Cutting Requirements

### 5.1 Glassmorphism Everywhere

Every interactive surface must use BlurView:

- Tab bars
- Headers
- Input bars
- Modals and sheets
- Cards
- Attachment pickers

### 5.2 Animations

- **Scroll animations:** Parallax and fade effects
- **Page transitions:** Spring physics
- **List items:** Staggered entrance (MotiView)
- **Loading states:** Skeleton views

### 5.3 Moving Media

- Some images should be video snippets (like Instagram)
- Background videos where appropriate
- Animated placeholders

### 5.4 All Buttons Functional

- Every button must do something
- If feature not ready, show placeholder/coming soon
- No dead-end interactions

---

## 6. Technical Constraints & Standards

- **Framework:** Expo SDK 54, React Native 0.87
- **Performance:** 60 FPS animations via Reanimated
- **TypeScript:** 0 errors in strict mode
- **Offline First:** Cached content loads immediately
- **Safety:** AI outputs pass through crisis detection filter
- **Privacy:** User data encrypted, RAG memory user-scoped

### 6.1 Key Dependencies

```json
{
  "expo-av": "Audio/Video recording and playback",
  "expo-blur": "Glassmorphism effects",
  "expo-linear-gradient": "Background gradients",
  "expo-haptics": "Tactile feedback",
  "react-native-reanimated": "High-performance animations",
  "moti": "Declarative animations",
  "zustand": "State management",
  "@supabase/supabase-js": "Backend services"
}
```

### 6.2 API Integrations

- **OpenAI:** Chat completions, Whisper transcription, DALL-E image generation
- **Supabase:** Auth, Database, Vector store
- **LangSmith:** Agent tracing and monitoring

---

## 7. Future Roadmap

### Phase 1 (Current - v4.0)

- ✅ Voice recording + Whisper transcription
- ✅ Glassmorphism UI throughout
- ✅ Theme integration (light/dark)
- ✅ Haptic feedback standardization
- ✅ Model selector for Imagine
- ✅ Time-based suggestions
- ⏳ Video snippets in Library
- ⏳ Full Settings implementation

### Phase 2 (v4.1)

- Video Generation (Runway/Luma integration)
- Epoch integration for intelligent conversations
- TheWhisper evaluation for improved speech recognition
- Thinking-with-Video integration for multimedia reasoning

### Phase 3 (v5.0)

- Desktop/Web Version
- WatchOS companion
- Local LLM option for privacy
- Advanced multi-modal AI

---

## 8. External Integration Evaluation

The following external projects were evaluated for integration:

| Project                                                                  | Purpose                              | Status                                    |
| :----------------------------------------------------------------------- | :----------------------------------- | :---------------------------------------- |
| [Epoch](https://github.com/ItzCrazyKns/Epoch)                            | Intelligent time-aware conversations | Evaluate for Phase 2                      |
| [TheWhisper](https://github.com/TheStageAI/TheWhisper)                   | Enhanced speech recognition          | Compare vs current Whisper implementation |
| [Thinking-with-Video](https://github.com/tongjingqi/Thinking-with-Video) | Video reasoning                      | Evaluate for Phase 2                      |

---

## 9. Known Issues & Next Steps

### Current Issues

1. **Metro Bundler Cache:** Changes may not appear without full cache clear
2. **Expo Go Refresh:** Sometimes requires full app close/reopen

### To Test Changes

1. Stop all Expo processes: `pkill -f expo`
2. Clear cache: `npx expo start --clear`
3. Close Expo Go completely on device
4. Rescan QR code or reopen project

### Troubleshooting Voice

1. Check microphone permissions in device settings
2. Ensure OPENAI_API_KEY is set in .env
3. Test on physical device (simulator has limitations)

---

**Document maintained by:** Development Team
**GitHub:** https://github.com/MartinQue/MyExpoApp
