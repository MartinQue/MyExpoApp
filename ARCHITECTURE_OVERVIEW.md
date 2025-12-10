# Happiness AI App - Architecture & Concept Overview

**Generated:** 2025-12-06  
**Purpose:** Comprehensive understanding of codebase structure, concept, and architecture before making significant changes

---

## 🎯 Core Concept

**Happiness AI** is a **premium AI-powered multi-agent companion app** designed to be a personal growth and happiness assistant. The app aims to match the quality and experience of Grok's companion interface, featuring:

- **High-fidelity anime avatars** (Project Airi assets) with animated states
- **Voice-first interactions** with natural TTS (IndexTTS primary, ElevenLabs fallback)
- **Multi-agent AI system** that routes conversations to specialist agents
- **Glassmorphism UI design** throughout
- **Context-aware personalization** using location, time, mood, and conversation history

### Target Experience

The app strives to be a **Grok-level companion experience** with:

- Full-screen animated anime characters
- Natural voice conversations
- Contextual, empathetic responses
- Beautiful glassmorphism UI
- Seamless multi-modal interactions (text, voice, images)

---

## 🏗️ Architecture Overview

### Monorepo Structure

```
MyExpoApp/
├── apps/
│   └── happiness-app/          # Main application
│       ├── app/                 # Expo Router pages (file-based routing)
│       ├── components/          # React components
│       ├── stores/              # Zustand state management
│       ├── contexts/            # React Context (Theme, Auth, Voice)
│       ├── lib/                 # Business logic & services
│       ├── constants/           # Design system & config
│       ├── types/               # TypeScript definitions
│       └── assets/              # Static files (avatars, animations)
│
├── packages/
│   └── shared-config/           # Shared environment variables
│
├── langgraph/                   # Python backend (multi-agent orchestration)
└── docs/                        # Documentation
```

### Technology Stack

**Frontend:**

- **Runtime:** React Native 0.81.5 (Expo SDK 54)
- **Language:** TypeScript 5.9 (strict mode)
- **Navigation:** Expo Router 6.0 (file-based)
- **State:** Zustand 5.0 (feature state) + React Context (global)
- **UI:** Custom Glassmorphism components
- **Styling:** NativeWind + StyleSheet
- **Animation:** Reanimated 4 + Moti

**Backend:**

- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Vector Search:** Supabase (for RAG/memory retrieval)

**AI Services:**

- **LLM:** OpenAI GPT-4o-mini (primary)
- **Image Generation:** DALL-E 3
- **Voice TTS:** IndexTTS (primary), ElevenLabs (fallback), expo-speech (fallback)
- **Voice STT:** Google Gemini Whisper (via proxy)
- **Agent Orchestration:** LangGraph (Python backend, optional)

---

## 📱 App Structure

### Main Tabs (5 screens)

1. **Profile Tab** (`/profile`)

   - Dynamic home feed with contextual cards
   - Location-aware content
   - Quick action buttons
   - Daily stats and progress
   - Hero video snippets

2. **Ask Tab** (`/chat`)

   - Chat interface with AI companion
   - Voice input/output
   - Multi-agent routing
   - Context-aware responses
   - Message history

3. **Alter Ego Tab** (`/alter-ego` - future)

   - Full-screen animated avatar
   - Voice-first interactions
   - Character selection
   - Floating controls (streaks, capture, outfit, etc.)
   - "Start talking" CTA

4. **Imagine Tab** (`/imagine`)

   - AI image generation (DALL-E 3)
   - Gallery of generated images
   - Style presets and aspect ratios
   - Template gallery
   - Video generation (planned)

5. **Library Tab** (`/library`)

   - Knowledge vault
   - Media library (images, videos, voice memos)
   - Search and organization
   - Meeting transcripts

6. **Planner Tab** (`/planner`)
   - Goal setting and tracking
   - Task management
   - Progress visualization
   - Milestones

---

## 🧩 Core Architecture Patterns

### 1. State Management

**Zustand Stores** (feature-specific state):

- `chatStore.ts` - Chat messages, sessions, voice mode
- `imagineStore.ts` - Generated images, generation state
- `plannerStore.ts` - Goals, tasks, plans
- `libraryStore.ts` - Media library items
- `userStore.ts` - User profile, preferences, theme
- `authStore.ts` - Authentication state

**React Context** (cross-cutting concerns):

- `ThemeContext` - Light/dark theme, colors, gradients
- `AuthContext` - User authentication
- `VoiceContext` - Voice recording state (shared across screens)
- `ThinkingContext` - AI thinking/processing state

### 2. Service Layer Pattern

All API calls and business logic go through services:

```
lib/
├── services/
│   └── chatService.ts          # Chat operations
├── imageGeneration.ts           # DALL-E 3 integration
├── videoGeneration.ts           # Video generation (planned)
├── think.ts                     # AI analysis & agent routing
├── memory.ts                    # RAG memory retrieval
├── database.ts                  # Supabase CRUD operations
└── voice/
    ├── ttsService.ts            # Text-to-speech
    ├── elevenLabsService.ts    # ElevenLabs TTS
    └── transcriptionProvider.ts # Speech-to-text
```

### 3. Multi-Agent System

**Agent Architecture:**

```
Supervisor Agent (routes to specialists)
├── Finance Agent
├── Health Agent
├── Relationships Agent
├── Career Agent
├── Mindfulness Agent
├── Creativity Agent
├── Goals Agent
└── General Agent (fallback)
```

**Routing Logic:**

- Messages analyzed for intent
- Routed to appropriate specialist agent
- Responses maintain "alter_ego" persona
- Context from past conversations (RAG)

**Current Implementation:**

- Primary: Direct OpenAI with system prompts
- Secondary: LangGraph orchestration (optional, currently disabled)
- Fallback: Simple OpenAI integration

### 4. Design System

**Glassmorphism Pattern:**

- All UI uses `BlurView` with intensity 60-80
- Subtle white borders (10% opacity)
- Semi-transparent backgrounds (5-10% white)
- Rounded corners (12-24px)
- Theme-aware (light/dark tint)

**Theme System:**

- Dark theme (default): Pure black backgrounds, white text
- Light theme: White backgrounds, dark text
- Tab-specific gradients for visual identity
- Consistent color tokens throughout

**Haptic Feedback:**

- Light: taps, selections
- Medium: confirmations
- Heavy: errors, important actions
- Context-specific patterns (voice start/stop, success, error)

---

## 🔄 Data Flow

### Chat Flow

```
User Input (text/voice)
  ↓
VoiceContext (if voice) → Transcription
  ↓
ChatStore.sendMessage()
  ↓
chatService.sendMessage()
  ↓
think.analyzeNote()
  ↓
[Multi-agent routing or direct OpenAI]
  ↓
Response received
  ↓
ChatStore (adds to messages)
  ↓
TTS Service (speaks response)
  ↓
UI updates (message bubble, avatar animation)
```

### Image Generation Flow

```
User prompt
  ↓
imagineStore.generateImage()
  ↓
imageGeneration.generateImage()
  ↓
OpenAI DALL-E 3 API
  ↓
Image URL returned
  ↓
imagineStore (saves to state)
  ↓
Supabase (saves to database)
  ↓
UI updates (gallery)
```

### Memory/RAG Flow

```
User message
  ↓
memory.retrieveRelevantMemories()
  ↓
Supabase vector search (embeddings)
  ↓
Relevant past conversations retrieved
  ↓
memory.buildContextFromMemories()
  ↓
Injected into AI system prompt
  ↓
Context-aware response
```

---

## 🗄️ Database Schema (Supabase)

### Core Tables

**conversations**

- `id`, `user_id`, `title`, `last_message_preview`, `active_agent`, `created_at`, `updated_at`

**messages**

- `id`, `conversation_id`, `user_id`, `role` (user/ai/system), `content`, `agent_name`, `media_url`, `media_type`, `created_at`

**plans**

- `id`, `user_id`, `title`, `description`, `progress`, `next_task`, `due_date`, `status`, `theme_color`, `created_at`, `updated_at`

**milestones**

- `id`, `plan_id`, `title`, `status`, `position`, `created_at`

**library_items**

- `id`, `user_id`, `category`, `type`, `title`, `url`, `thumbnail`, `duration`, `summary`, `transcript`, `action_items`, `participants`, `tags`, `created_at`

**generated_images**

- `id`, `user_id`, `prompt`, `enhanced_prompt`, `image_url`, `style`, `aspect_ratio`, `credits_used`, `favorited`, `created_at`

**user_preferences**

- `user_id`, `display_name`, `avatar_url`, `theme`, `mood`, `credits`, `is_pro`, `notification_enabled`, `haptic_enabled`, `voice_enabled`, `updated_at`

---

## 🎨 UI Components

### Component Organization

```
components/
├── tabs/                    # Full-screen tab components
│   ├── ProfileTab.tsx
│   ├── AskScreen.tsx
│   ├── AlterEgoScreen.tsx
│   ├── ImagineTab.tsx
│   ├── LibraryTab.tsx
│   └── PlannerTab.tsx
│
├── chat/                    # Chat-specific components
│   ├── ChatInputBar.tsx
│   ├── MessageBubble.tsx
│   ├── VoiceInputButton.tsx
│   └── ChatComposer.tsx
│
├── Glass/                   # Glassmorphism design system
│   ├── GlassButton.tsx
│   ├── GlassCard.tsx
│   ├── GlassView.tsx
│   └── GlassHeader.tsx
│
├── companions/              # Avatar/companion components
│   ├── AniCharacter.tsx
│   ├── Live2DCharacter.tsx
│   └── ImagePickerModal.tsx
│
├── imagine/                 # Image generation UI
│   ├── ImagineControls.tsx
│   ├── ImagineFeed.tsx
│   └── ImagineInputBar.tsx
│
└── navigation/
    └── TabBar.tsx           # Custom tab bar
```

---

## 🔐 Security & Configuration

### Environment Variables

All environment variables accessed via `@myexpoapp/shared-config`:

- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **OpenAI:** `OPENAI_API_KEY`
- **LangGraph:** `LANGGRAPH_URL`, `LANGCHAIN_API_KEY`
- **Voice:** `ELEVENLABS_API_KEY`, `GOOGLE_AI_API_KEY`, `GEMINI_MODEL`
- **External:** `EPOCH_API_URL`, `THINKING_VIDEO_API_URL`, `THEWHISPER_API_URL`

### API Key Management

- Keys stored in root `.env.local` (not committed)
- Accessed via `packages/shared-config`
- Validated on app startup
- Graceful degradation if keys missing

---

## 🚀 Current State & Known Issues

### Production Readiness Status

**✅ Complete:**

- Core chat functionality
- Image generation (DALL-E 3)
- Voice input/output
- Multi-agent routing (basic)
- Database integration
- Theme system
- Glassmorphism UI

**⚠️ In Progress:**

- High-fidelity avatar rendering (Project Airi integration)
- IndexTTS integration (currently using ElevenLabs/expo-speech)
- Alter Ego screen full implementation
- Video generation
- Settings page functionality

**❌ Known Gaps (from PRD):**

- Avatar rendering: Only static emoji/illustrations (no Project Airi)
- Chat ergonomics: Keyboard handling issues
- Theme handling: Some inconsistencies
- Audio quality: ElevenLabs sounds robotic (IndexTTS not integrated)
- Navigation: Some tabs still reference old names
- Context prompts: Need reinforcement for Airi-first visuals and IndexTTS-first audio

---

## 📊 Key Metrics & Patterns

### Performance Considerations

- **State Management:** Zustand for fast, lightweight state
- **Animations:** Reanimated 4 (native driver)
- **Images:** expo-image for optimized loading
- **Lists:** FlatList for virtualization
- **Memoization:** React.memo, useMemo, useCallback where needed

### Error Handling

- Global error boundary
- Service-level error handling
- User-friendly error messages
- Graceful fallbacks (e.g., TTS providers)
- Retry mechanisms for API calls

### Code Quality

- **TypeScript:** Strict mode, no `any` types
- **Linting:** ESLint with Expo config
- **Formatting:** Prettier
- **Imports:** `@` alias for local imports
- **Naming:** Consistent conventions (PascalCase components, camelCase functions)

---

## 🎯 Design Principles

1. **Glassmorphism First:** All UI uses glassmorphism design
2. **Voice-First:** Voice interactions are primary, text is secondary
3. **Context-Aware:** Responses use location, time, mood, history
4. **Empathetic AI:** Companion persona, not assistant
5. **Premium Quality:** Match Grok-level experience
6. **Performance:** 60fps animations, fast response times
7. **Accessibility:** Haptic feedback, theme support, readable text

---

## 🔮 Future Enhancements (from PRD)

1. **Project Airi Integration:** High-fidelity anime avatars with animations
2. **IndexTTS:** Natural voice synthesis (primary TTS)
3. **Video Generation:** HoloCine integration
4. **Enhanced Settings:** Full functionality (profile, security, subscription)
5. **Keyboard Handling:** Proper avoidance and animations
6. **Theme Consistency:** Complete light/dark parity
7. **Context Engineering:** Reinforced prompts for visual/audio directives

---

## 📝 Development Workflow

### Adding a New Feature

1. **Create Zustand store** (if needed) in `stores/`
2. **Create service** in `lib/services/` or `lib/`
3. **Create components** in `components/[feature]/`
4. **Add types** in `types/`
5. **Update database schema** (if needed) in Supabase
6. **Follow glassmorphism pattern** for UI
7. **Add haptic feedback** to interactions
8. **Support light/dark themes**
9. **Handle loading/error states**
10. **Test on iOS, Android, Web**

### Code Generation Rules

- Use `@` alias for imports
- Follow BMAD_RULES.md
- Use TypeScript strict mode
- No `any` types
- No `console.log` in production
- Use Logger utility
- Follow naming conventions
- Add proper error handling

---

## 🎓 Key Learnings

1. **Monorepo Structure:** Apps isolated, shared code in packages
2. **Service Layer:** All API calls through services, not components
3. **State Management:** Zustand for features, Context for global
4. **Design System:** Glassmorphism is core to UI identity
5. **Voice-First:** Voice interactions are primary UX
6. **Context Matters:** AI responses use location, time, mood, history
7. **Multi-Agent:** Specialist agents for different topics
8. **Premium Experience:** Quality over speed, match Grok-level

---

## 🔍 Areas for Improvement

1. **Avatar System:** Need Project Airi integration for high-fidelity avatars
2. **TTS Quality:** IndexTTS integration for natural voice
3. **Keyboard Handling:** Better avoidance and animations
4. **Settings:** Complete functionality implementation
5. **Error Handling:** More comprehensive error boundaries
6. **Testing:** Unit tests, integration tests
7. **Performance:** Bundle size optimization, lazy loading
8. **Documentation:** More inline comments, API docs

---

**This document provides a comprehensive overview of the Happiness AI app architecture, concept, and current state. Use this as a reference when making significant changes to ensure consistency and maintainability.**




