# Codebase Structure - MyExpoApp

Understanding the monorepo organization and where everything lives.

---

## 🏗️ Monorepo Overview

This is a **monorepo** managed with **npm workspaces**. Multiple apps and shared packages coexist in a single repository.

```
MyExpoApp/                      # Root monorepo
├── apps/                       # All applications
│   └── happiness-app/          # Main production app
│
├── packages/                   # Shared code
│   └── shared-config/          # Environment configuration
│
├── langgraph/                  # Python backend (separate)
├── docs/                       # Documentation
├── .context/                   # AI context files (this directory)
│
├── BMAD_RULES.md              # Architecture rules
├── MONOREPO_GUIDE.md          # Monorepo usage guide
├── .cursorrules                # Cursor AI rules
├── package.json                # Workspace root
└── .env.local                  # Shared environment variables
```

---

## 📱 App Structure: happiness-app

The reference implementation for all future apps.

```
apps/happiness-app/
│
├── app/                        # Expo Router (file-based navigation)
│   ├── _layout.tsx             # Root layout with providers
│   ├── index.tsx               # Initial splash/landing
│   ├── settings.tsx            # Full settings modal
│   └── (tabs)/                 # Tab navigation group
│       ├── _layout.tsx         # Tab bar layout
│       ├── profile.tsx         # Home/Profile tab
│       ├── chat.tsx            # Chat/Ask tab
│       ├── imagine.tsx         # Image generation tab
│       ├── library.tsx         # Media library tab
│       └── planner.tsx         # Goals/planner tab
│
├── components/                 # React components
│   ├── tabs/                   # Full-screen tab components
│   │   ├── ChatTab.tsx
│   │   ├── AskScreen.tsx      # Main chat interface
│   │   ├── AlterEgoScreen.tsx # Avatar conversation
│   │   ├── ImagineTab.tsx
│   │   ├── LibraryTab.tsx
│   │   ├── PlannerTab.tsx
│   │   └── ProfileTab.tsx
│   │
│   ├── chat/                   # Chat-specific components
│   │   ├── ChatInputBar.tsx
│   │   ├── VoiceInputButton.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatComposer.tsx
│   │   └── AttachmentSheet.tsx
│   │
│   ├── Glass/                  # Glassmorphism design system
│   │   ├── GlassButton.tsx
│   │   ├── GlassCard.tsx
│   │   ├── GlassHeader.tsx
│   │   └── GlassView.tsx
│   │
│   ├── ui/                     # Base UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ThemedText.tsx
│   │   ├── ScalePressable.tsx
│   │   └── Skeleton.tsx
│   │
│   ├── home/                   # Profile screen components
│   ├── imagine/                # Image gen components
│   ├── navigation/             # Navigation-related
│   ├── DevTools/               # Development utilities
│   ├── AnimatedAvatar.tsx      # 3D speaking avatar
│   ├── ThinkingDock.tsx        # AI thinking indicator
│   └── ErrorBoundary.tsx       # Error handling
│
├── stores/                     # Zustand state management
│   ├── chatStore.ts            # Chat messages & voice
│   ├── userStore.ts            # User profile & prefs
│   ├── imagineStore.ts         # Generated images
│   ├── libraryStore.ts         # Media vault
│   ├── plannerStore.ts         # Goals & tasks
│   └── authStore.ts            # Authentication
│
├── contexts/                   # React Context providers
│   ├── ThemeContext.tsx        # Light/dark theme
│   ├── AuthContext.tsx         # User authentication
│   └── VoiceContext.tsx        # Voice recording state
│
├── hooks/                      # Custom React hooks
│   ├── useChat.ts              # Chat management
│   ├── useHaptics.ts           # Haptic feedback
│   ├── useUser.ts              # User data
│   ├── useThemeColor.ts        # Theme color selector
│   └── hooks/                  # Subdirectory
│
├── lib/                        # Business logic & services
│   ├── api/                    # API service layer
│   │   ├── epochService.ts     # Intelligent conversation orchestration
│   │   ├── theWhisperService.ts # Advanced speech recognition
│   │   └── thinkingWithVideoService.ts # Video reasoning AI
│   │
│   ├── services/               # Feature services
│   │   └── chatService.ts
│   │
│   ├── agents/                 # Multi-agent orchestration
│   │   └── AgentManager.ts     # LangGraph agent router
│   │
│   ├── voice.ts                # Voice recording & transcription
│   ├── openai-realtime.ts      # Real-time voice processing
│   ├── think.ts                # Thinking/reasoning prompts
│   ├── memory.ts               # User memory & RAG
│   ├── homeFeed.ts             # Home feed generation
│   ├── imageGeneration.ts      # DALL-E integration
│   ├── videoGeneration.ts      # Video generation setup
│   ├── database.ts             # Supabase client & queries
│   ├── supabase.ts             # Supabase auth setup
│   ├── langsmith.ts            # LangSmith monitoring
│   ├── haptics.ts              # Haptic feedback standardization
│   ├── audio-recording.ts      # expo-av recording wrapper
│   ├── ThinkingContext.tsx     # AI thinking state
│   └── safety.ts               # Crisis detection filter
│
├── constants/                  # Design system & configuration
│   ├── DesignSystem.ts         # Core palette, typography, spacing
│   ├── Theme.ts                # Light/dark theme definitions
│   ├── Avatars.ts              # Avatar emoji/image mappings
│   ├── Config.ts               # API endpoints, feature flags
│   ├── GrokColors.ts           # Grok-inspired color scheme
│   ├── GrokLayout.ts           # Spacing & sizing rules
│   ├── GrokTypography.ts       # Font sizes, weights
│   ├── Layout.ts               # Responsive breakpoints
│   ├── MockData.ts             # Sample development data
│   ├── safety.ts               # Safety guidelines for AI
│   └── index.ts                # Exports
│
├── types/                      # TypeScript type definitions
│   ├── chat.ts                 # Message, ConversationThread
│   ├── feed.ts                 # FeedItem, Post
│   ├── goals.ts                # Goal, Milestone
│   ├── imagination.ts          # GeneratedImage, ModelConfig
│   ├── media.ts                # MediaItem, VideoSnippet
│   └── user.ts                 # User, Profile, Preferences
│
├── utils/                      # Helper functions
│   ├── Logger.ts               # Console logging utility
│   ├── context.ts              # Context/metadata helpers
│   ├── formatting.ts           # String/date formatting
│   ├── responsive.ts           # Responsive layout helpers
│   └── validation.ts           # Input validation functions
│
├── assets/                     # Static media
│   ├── images/                 # Icons, splash, branding
│   │   ├── icon.png
│   │   ├── splash-icon.png
│   │   ├── favicon.png
│   │   └── adaptive-icon.png
│   ├── animations/             # Lottie JSON animations
│   ├── avatars/                # Avatar images/emojis
│   └── fonts/                  # Custom fonts
│
├── scripts/                    # Build & utility scripts
│   └── reset-project.js
│
├── package.json                # App dependencies
├── app.config.ts               # Expo configuration
├── tsconfig.json               # TypeScript config
├── babel.config.js             # Babel config
├── .eslintrc.json              # ESLint rules
└── .prettierrc                 # Code formatting
```

---

## 📦 Shared Packages

### packages/shared-config

Environment variable management for all apps.

```
packages/shared-config/
├── index.js                    # Exports all env variables
├── index.d.ts                  # TypeScript definitions
├── package.json
└── README.md
```

**Usage:**
```typescript
import config from '@myexpoapp/shared-config';

const supabaseUrl = config.SUPABASE_URL;
const openaiKey = config.OPENAI_API_KEY;
```

**Available Variables:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `LANGCHAIN_API_KEY`
- `LANGGRAPH_URL`
- `ELEVENLABS_API_KEY`
- `GOOGLE_AI_API_KEY`
- `GEMINI_MODEL`
- And more...

---

## 🐍 Python Backend: langgraph

Separate Python backend for multi-agent orchestration.

```
langgraph/
├── .venv/                      # Python virtual environment
├── local_package/              # LangGraph agent definitions
│   └── local_package/
│       ├── __init__.py
│       └── agent.py            # Multi-agent supervisor logic
├── langgraph.json              # LangGraph API config
└── requirements.txt            # Python dependencies
```

**Agent System:**
- Supervisor Agent (routes requests)
- 8 Specialist Agents:
  - Finance
  - Health
  - Relationships
  - Career
  - Mindfulness
  - Creativity
  - Goals
  - General (fallback)

---

## 📚 Documentation

```
docs/
├── PRODUCT_REQUIREMENTS_DOCUMENT.md  # Full v4.0 spec
├── FIGMA_DESIGN_BRIEF.md            # UI/UX design specs
├── FIGMA_QUICK_START.md
├── PHASE_1_SUMMARY.md               # Implementation phases
├── IMPLEMENTATION_COMPLETE.md       # Completion checklist
├── EXTERNAL_INTEGRATIONS.md         # Epoch, TheWhisper, etc.
├── CORRECTIONS_APPLIED.md
├── CURRENT_STATUS.md
├── CHECK_SUPABASE.md
└── [25+ more guides and logs]
```

---

## 🤖 AI Context Files

```
.context/
├── README.md                   # Context engineering intro
├── patterns.md                 # Common code patterns
├── structure.md                # This file
├── agents.md                   # Agent system docs
└── examples/                   # Example implementations
    ├── glassmorphism-component.tsx
    ├── zustand-store.ts
    ├── service-layer.ts
    └── agent-integration.tsx
```

---

## 🗂️ File Naming Conventions

| Type | Pattern | Location | Example |
|------|---------|----------|---------|
| **Screens** | PascalCase.tsx | `app/` | `settings.tsx` |
| **Components** | PascalCase.tsx | `components/[feature]/` | `ChatInputBar.tsx` |
| **Stores** | camelCase.ts | `stores/` | `chatStore.ts` |
| **Services** | PascalCase.ts | `lib/services/` | `ChatService.ts` |
| **Hooks** | camelCase.ts | `hooks/` | `useChat.ts` |
| **Contexts** | PascalCase.tsx | `contexts/` | `ThemeContext.tsx` |
| **Types** | camelCase.ts | `types/` | `chat.ts` |
| **Utils** | camelCase.ts | `utils/` | `formatting.ts` |
| **Constants** | PascalCase.ts | `constants/` | `DesignSystem.ts` |

---

## 📍 Import Path Resolution

### Aliases

```typescript
// @ alias points to app root
import { useChat } from '@/hooks/useChat';
import { ChatService } from '@/lib/services/ChatService';
import { GlassButton } from '@/components/Glass/GlassButton';

// Workspace packages
import config from '@myexpoapp/shared-config';

// Future shared packages
import { Button } from '@myexpoapp/shared-ui'; // When created
```

### Babel Configuration
```javascript
// babel.config.js
{
  alias: {
    '@': './',
  }
}
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 🎯 Feature Organization Pattern

Features are organized by domain, not by type.

### ✅ CORRECT (Feature-based)
```
components/
├── chat/                       # All chat components together
│   ├── ChatInputBar.tsx
│   ├── MessageBubble.tsx
│   └── AttachmentSheet.tsx
│
lib/services/
└── ChatService.ts              # Chat business logic

stores/
└── chatStore.ts                # Chat state

types/
└── chat.ts                     # Chat types
```

### ❌ WRONG (Type-based)
```
components/
├── inputs/
│   ├── ChatInputBar.tsx        # Don't organize by component type
│   └── SearchInput.tsx
├── bubbles/
│   └── MessageBubble.tsx
```

---

## 📱 Navigation Structure

### Expo Router Pattern
```
app/
├── _layout.tsx                 # Root layout (providers)
├── index.tsx                   # Initial route
├── settings.tsx                # Modal route
│
└── (tabs)/                     # Tab group (parentheses = layout route)
    ├── _layout.tsx             # Tab layout
    ├── profile.tsx             # /profile
    ├── chat.tsx                # /chat
    ├── imagine.tsx             # /imagine
    ├── library.tsx             # /library
    └── planner.tsx             # /planner
```

### Route URLs
- `/` - Initial screen (index.tsx)
- `/profile` - Profile tab
- `/chat` - Chat tab
- `/imagine` - Image generation tab
- `/library` - Media library tab
- `/planner` - Goals & planner tab
- `/settings` - Settings modal

---

## 🔧 Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `package.json` | App dependencies | `apps/[app]/` |
| `app.config.ts` | Expo configuration | `apps/[app]/` |
| `tsconfig.json` | TypeScript config | `apps/[app]/` |
| `babel.config.js` | Babel transpiler | `apps/[app]/` |
| `.eslintrc.json` | Linting rules | `apps/[app]/` |
| `.prettierrc` | Code formatting | `apps/[app]/` |
| `.env.local` | Environment variables | Root only |

---

## 🌐 Environment Variables

**Defined in:** Root `.env.local`
**Accessed via:** `@myexpoapp/shared-config`

```
Root .env.local
    ↓
packages/shared-config/index.js
    ↓
All apps import and use
```

**Never:**
- ❌ Create `.env.local` in app directories
- ❌ Use `process.env` directly
- ❌ Commit `.env.local` to git

**Always:**
- ✅ Define in root `.env.local`
- ✅ Access via `@myexpoapp/shared-config`
- ✅ Add new variables to shared-config exports

---

## 🚀 Adding a New App

When creating a new app, replicate the happiness-app structure:

```bash
mkdir apps/new-app
cd apps/new-app

# Create the same structure
mkdir -p app components stores contexts hooks lib/services constants types utils assets
```

Follow the exact folder structure as happiness-app for consistency.

---

## 📊 Dependency Management

### Hoisting
Dependencies are **hoisted** to root `node_modules/`:

```
MyExpoApp/
├── node_modules/               # All dependencies here
│   └── @myexpoapp/
│       ├── happiness-app       # Symlink to apps/happiness-app
│       └── shared-config       # Symlink to packages/shared-config
│
├── apps/happiness-app/
│   └── (no node_modules)       # Dependencies hoisted
│
└── packages/shared-config/
    └── (no node_modules)       # Dependencies hoisted
```

### Installing Packages

```bash
# From root (install for all workspaces)
npm install

# For specific app
npm install <package> --workspace=@myexpoapp/happiness-app

# For specific package
npm install <package> --workspace=@myexpoapp/shared-config
```

---

## 🎯 Quick Reference

### Finding Code

| Looking for... | Check... |
|----------------|----------|
| UI Components | `components/[feature]/` |
| State Logic | `stores/[feature]Store.ts` |
| API Calls | `lib/services/[Feature]Service.ts` |
| Types | `types/[domain].ts` |
| Design Tokens | `constants/DesignSystem.ts` |
| Hooks | `hooks/use[Feature].ts` |
| Screens | `app/[screen].tsx` |
| Contexts | `contexts/[Feature]Context.tsx` |

### Common Paths

```typescript
// Components
'@/components/Glass/GlassButton'
'@/components/chat/ChatInputBar'

// Stores
'@/stores/chatStore'
'@/stores/userStore'

// Services
'@/lib/services/ChatService'
'@/lib/agents/AgentManager'

// Hooks
'@/hooks/useChat'
'@/hooks/useHaptics'

// Contexts
'@/contexts/ThemeContext'
'@/contexts/AuthContext'

// Constants
'@/constants/DesignSystem'
'@/constants/Theme'

// Types
'@/types/chat'
'@/types/user'

// Config
'@myexpoapp/shared-config'
```

---

**Version**: 1.0.0
**Last Updated**: December 3, 2025
