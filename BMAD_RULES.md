# BMAD Rules - MyExpoApp Architecture

**Build, Maintain, And Deploy** - Architectural rules and patterns for AI-assisted development.

**Version:** 1.0.0
**Last Updated:** December 3, 2025
**Target:** AI Development Tools (Cursor, KiloCode, Claude, GPT-5 Codex)

---

## 🎯 Purpose

This document defines the **architectural laws** for MyExpoApp monorepo. Every AI agent, code generator, and developer MUST follow these rules to maintain consistency, quality, and scalability.

---

## 📐 Architecture Overview

### Core Principles

1. **Monorepo First** - All apps under `apps/`, all shared code under `packages/`
2. **Isolation** - Apps never directly import from other apps
3. **Shared by Design** - Common code lives in `packages/` with explicit exports
4. **Type Safety** - Strict TypeScript everywhere, no `any` unless absolutely necessary
5. **Convention over Configuration** - Follow established patterns, don't invent new ones

### Technology Stack

```
Runtime:      React Native 0.81.5 (Expo SDK 54)
Language:     TypeScript 5.9 (strict mode)
Navigation:   Expo Router (file-based)
State:        Zustand 5.0 (stores) + React Context (cross-cutting)
UI:           Custom Glassmorphism Components
Styling:      NativeWind + StyleSheet
Animation:    Reanimated 4 + Moti
Backend:      Supabase (auth, storage, vectors)
AI:           OpenAI GPT-4, DALL-E 3, Whisper
Voice:        ElevenLabs TTS, expo-av
Agents:       LangGraph (Python backend)
```

---

## 📁 Monorepo Structure

### Directory Rules

```
MyExpoApp/
├── apps/                           # ✅ All applications go here
│   ├── happiness-app/              # ✅ Main app (reference implementation)
│   └── [future-apps]/              # ✅ New apps follow same structure
│
├── packages/                       # ✅ Shared code only
│   ├── shared-config/              # ✅ Environment variables
│   └── [future-packages]/          # ✅ UI, utils, types, etc.
│
├── langgraph/                      # ⚠️ Python backend (separate concerns)
├── docs/                           # 📚 Documentation
├── .context/                       # 🤖 AI context files
├── BMAD_RULES.md                  # 📐 This file
└── package.json                    # 🔧 Workspace root
```

### ❌ NEVER Put Here:
- ❌ App-specific code in root directory
- ❌ Components outside of `apps/*/components/`
- ❌ Duplicate shared code across apps
- ❌ node_modules in app directories (hoisted to root)

### ✅ ALWAYS Put Here:
- ✅ New apps in `apps/[app-name]/`
- ✅ Shared config in `packages/shared-config/`
- ✅ Shared UI in `packages/shared-ui/` (when created)
- ✅ Environment variables in root `.env.local`

---

## 🏗️ App Structure Pattern

Every app MUST follow this structure:

```
apps/[app-name]/
├── app/                            # Expo Router pages (file-based routing)
│   ├── _layout.tsx                 # Root layout with providers
│   ├── index.tsx                   # Initial screen
│   ├── (tabs)/                     # Tab group (if using tabs)
│   │   ├── _layout.tsx             # Tab layout
│   │   └── [tab].tsx               # Individual tabs
│   └── [feature].tsx               # Other screens/modals
│
├── components/                     # React components
│   ├── tabs/                       # Full-screen tab components
│   ├── [feature]/                  # Feature-specific components
│   ├── Glass/                      # Glassmorphism components
│   └── ui/                         # Base UI primitives
│
├── stores/                         # Zustand state stores
│   └── [feature]Store.ts           # One store per feature
│
├── contexts/                       # React Context providers
│   └── [Feature]Context.tsx       # Cross-cutting concerns only
│
├── hooks/                          # Custom React hooks
│   └── use[Feature].ts             # Reusable stateful logic
│
├── lib/                            # Business logic & services
│   ├── api/                        # API service layer
│   ├── services/                   # Feature services
│   └── [domain].ts                 # Domain-specific logic
│
├── constants/                      # Design system & config
│   ├── DesignSystem.ts             # Colors, typography, spacing
│   ├── Theme.ts                    # Light/dark themes
│   └── Config.ts                   # Feature flags, endpoints
│
├── types/                          # TypeScript definitions
│   └── [domain].ts                 # Domain models
│
├── utils/                          # Pure utility functions
│   └── [category].ts               # Grouped utilities
│
├── assets/                         # Static files
│   ├── images/                     # Images, icons
│   ├── fonts/                      # Custom fonts
│   └── animations/                 # Lottie files
│
├── package.json                    # App dependencies
├── app.config.ts                   # Expo configuration
├── tsconfig.json                   # TypeScript config
└── babel.config.js                 # Babel config
```

---

## 🎨 Design System Rules

### Glassmorphism UI Pattern

**All UI components MUST follow the glassmorphism design:**

```typescript
// ✅ CORRECT - Glassmorphism pattern
import { BlurView } from 'expo-blur';

const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <BlurView
    intensity={80}
    tint="light" // or "dark" based on theme
    style={styles.glassContainer}
  >
    <View style={styles.glassInner}>
      {children}
    </View>
  </BlurView>
);

const styles = StyleSheet.create({
  glassContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glassInner: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
```

**Glass Component Rules:**
- ✅ Always wrap in `BlurView` with intensity 60-80
- ✅ Always add subtle white border (10% opacity)
- ✅ Always add semi-transparent background (5-10% white)
- ✅ Always use rounded corners (12-20px)
- ✅ Always respect theme (light/dark tint)

### Theme System

```typescript
// ✅ ALWAYS use theme context
import { useTheme } from '@/contexts/ThemeContext';

const Component = () => {
  const { theme, colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Content</Text>
    </View>
  );
};
```

**Theme Rules:**
- ✅ Always use `useTheme()` hook for colors
- ✅ Never hardcode colors (use theme colors)
- ✅ Support both light and dark mode
- ✅ Test UI in both themes

### Tab-Specific Gradients

Each tab has a unique gradient identity:

```typescript
// From constants/DesignSystem.ts
const TabGradients = {
  profile: ['#FF6B9D', '#FFA07A'],    // Pink coral
  chat: ['#4ECDC4', '#44A08D'],       // Teal green
  imagine: ['#667EEA', '#764BA2'],    // Purple blue
  library: ['#FFA751', '#FFE259'],    // Orange yellow
  planner: ['#2ECC71', '#27AE60'],    // Green
};
```

**Gradient Rules:**
- ✅ Use tab-specific gradients for headers
- ✅ Use subtle gradients for backgrounds
- ✅ Never mix gradients from different tabs
- ✅ Always use `expo-linear-gradient`

### Haptic Feedback

```typescript
// ✅ ALWAYS add haptics to interactions
import { useHaptics } from '@/hooks/useHaptics';

const Button = ({ onPress }: { onPress: () => void }) => {
  const { triggerHaptic } = useHaptics();

  const handlePress = () => {
    triggerHaptic('impact', 'light'); // tap feedback
    onPress();
  };

  return <Pressable onPress={handlePress}>...</Pressable>;
};
```

**Haptic Rules:**
- ✅ `light` - for taps, selections
- ✅ `medium` - for confirmations
- ✅ `heavy` - for errors, important actions
- ✅ `success` - for completions
- ✅ `warning` - for warnings
- ✅ `error` - for errors

---

## 📦 State Management Rules

### Zustand Stores (Preferred)

**Use Zustand for feature-specific state:**

```typescript
// ✅ CORRECT - Zustand store pattern
import { create } from 'zustand';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  reset: () =>
    set({ messages: [], isLoading: false }),
}));
```

**Zustand Rules:**
- ✅ One store per feature domain
- ✅ Include reset() method for cleanup
- ✅ Use TypeScript interfaces
- ✅ Keep stores flat (avoid deep nesting)
- ✅ No async logic in stores (use services)

### React Context (Limited Use)

**Use Context only for cross-cutting concerns:**

```typescript
// ✅ CORRECT - Context for theme
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const value = {
    theme,
    setTheme,
    colors: theme === 'light' ? lightColors : darkColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**Context Rules:**
- ✅ Use for: Theme, Auth, Voice (global app state)
- ❌ Don't use for: Feature state, UI state, form state
- ✅ Provide at root layout only
- ✅ Always create custom hook (useTheme, useAuth)

### When to Use What

| State Type | Tool | Example |
|------------|------|---------|
| Feature state | Zustand | Chat messages, generated images |
| Form state | Local useState | Input values, validation |
| Server state | React Query | API data, caching |
| Global app state | Context | Theme, auth, voice |
| URL state | Expo Router | Navigation params |

---

## 🧩 Component Patterns

### Component Naming

```typescript
// ✅ CORRECT naming patterns
GlassButton.tsx       // Glass prefix for glassmorphism components
ChatInputBar.tsx      // Feature + ComponentType
MessageBubble.tsx     // Clear, descriptive name
VoiceInputButton.tsx  // Specific purpose

// ❌ WRONG naming
button.tsx           // Too generic
Component1.tsx       // Meaningless
chat_input.tsx       // Wrong convention (use PascalCase)
```

### Component Structure

```typescript
// ✅ CORRECT - Component template
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

interface ComponentNameProps {
  title: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export const ComponentName = ({
  title,
  onPress,
  children
}: ComponentNameProps) => {
  const { colors, theme } = useTheme();
  const { triggerHaptic } = useHaptics();

  const handlePress = () => {
    triggerHaptic('impact', 'light');
    onPress?.();
  };

  return (
    <BlurView intensity={80} tint={theme} style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

### Component Organization

```
components/
├── tabs/                    # ✅ Full-screen feature components
│   ├── ChatTab.tsx
│   └── ProfileTab.tsx
│
├── chat/                    # ✅ Feature-specific components
│   ├── ChatInputBar.tsx
│   └── MessageBubble.tsx
│
├── Glass/                   # ✅ Glassmorphism design system
│   ├── GlassButton.tsx
│   ├── GlassCard.tsx
│   └── GlassView.tsx
│
└── ui/                      # ✅ Base primitives
    ├── Button.tsx
    └── Input.tsx
```

---

## 🔌 Service Layer Pattern

**ALL API calls and business logic MUST go through services:**

```typescript
// ✅ CORRECT - Service layer pattern
// lib/services/chatService.ts

import { supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';

export class ChatService {
  static async sendMessage(message: string, userId: string): Promise<Message> {
    // 1. Save to database
    const { data, error } = await supabase
      .from('messages')
      .insert({ content: message, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    // 2. Get AI response
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: message }],
    });

    return {
      id: data.id,
      content: data.content,
      aiResponse: aiResponse.choices[0].message.content,
    };
  }

  static async getHistory(userId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
```

**Service Rules:**
- ✅ One service per domain (ChatService, ImageService, etc.)
- ✅ Static methods or class instances
- ✅ Handle errors within service
- ✅ Return typed data
- ✅ Never call APIs directly from components

---

## 🤖 Multi-Agent System Rules

### Agent Architecture

```
LangGraph Backend (Python)
├── Supervisor Agent           # Routes to specialist agents
├── Finance Agent             # Financial advice
├── Health Agent              # Health & wellness
├── Relationships Agent       # Relationship advice
├── Career Agent              # Career guidance
├── Mindfulness Agent         # Meditation & mindfulness
├── Creativity Agent          # Creative pursuits
├── Goals Agent               # Goal setting & tracking
└── General Agent             # Fallback for other topics
```

### Agent Communication Pattern

```typescript
// ✅ CORRECT - Agent orchestration
import { langgraphClient } from '@/lib/agents/AgentManager';

export const useAgentChat = () => {
  const [response, setResponse] = useState<string>('');
  const [activeAgent, setActiveAgent] = useState<string>('supervisor');

  const sendToAgent = async (message: string) => {
    // 1. Supervisor routes to appropriate agent
    const result = await langgraphClient.invoke({
      input: message,
      config: { configurable: { thread_id: userId } },
    });

    // 2. Extract agent and response
    setActiveAgent(result.agent_used);
    setResponse(result.response);

    return result;
  };

  return { sendToAgent, activeAgent, response };
};
```

**Agent Rules:**
- ✅ Always go through supervisor for routing
- ✅ Include thread_id for conversation context
- ✅ Display which agent is responding
- ✅ Handle agent failures gracefully
- ✅ Track agent usage for analytics

---

## 🌐 Environment Variables

### Access Pattern

```typescript
// ✅ CORRECT - Use shared-config package
import config from '@myexpoapp/shared-config';

const supabaseUrl = config.SUPABASE_URL;
const openaiKey = config.OPENAI_API_KEY;

// ❌ WRONG - Direct process.env access
const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY; // Don't do this
```

### Available Variables

All environment variables are in root `.env.local` and accessible via `@myexpoapp/shared-config`:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `OPENAI_API_KEY` - OpenAI API key
- `LANGCHAIN_API_KEY` - LangChain API key
- `LANGGRAPH_URL` - LangGraph deployment URL
- `ELEVENLABS_API_KEY` - ElevenLabs TTS API key
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - Gemini model name

**Environment Rules:**
- ✅ Define all variables in root `.env.local`
- ✅ Access via `@myexpoapp/shared-config`
- ✅ Never commit `.env.local` to git
- ✅ Document new variables in shared-config README

---

## 🧪 Testing & Quality

### Type Safety

```typescript
// ✅ ALWAYS use strict TypeScript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// ✅ CORRECT - Proper typing
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  userId: string;
}

const addMessage = (message: Message): void => {
  // Implementation
};

// ❌ WRONG - Using any
const addMessage = (message: any) => { // Don't do this
  // Implementation
};
```

### Code Quality Rules

- ✅ No `any` types (use `unknown` if truly needed)
- ✅ No `console.log` in production (use Logger utility)
- ✅ No unused imports
- ✅ No unused variables
- ✅ Run `npm run typecheck` before committing
- ✅ Run `npm run lint` before committing

---

## 📝 File & Folder Naming

### Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ChatInputBar.tsx` |
| Hooks | camelCase (use prefix) | `useChat.ts`, `useTheme.ts` |
| Stores | camelCase (Store suffix) | `chatStore.ts`, `userStore.ts` |
| Utils | camelCase | `formatting.ts`, `validation.ts` |
| Types | camelCase | `chat.ts`, `user.ts` |
| Services | PascalCase (Service suffix) | `ChatService.ts` |
| Contexts | PascalCase (Context suffix) | `ThemeContext.tsx` |
| Constants | PascalCase | `DesignSystem.ts`, `Config.ts` |

### Import Aliases

```typescript
// ✅ ALWAYS use @ alias for imports
import { useChat } from '@/hooks/useChat';
import { ChatService } from '@/lib/services/ChatService';
import config from '@myexpoapp/shared-config';

// ❌ WRONG - Relative imports
import { useChat } from '../../../hooks/useChat'; // Don't do this
```

---

## 🚀 Performance Rules

### Optimization Patterns

```typescript
// ✅ CORRECT - Memoization
import { memo, useMemo, useCallback } from 'react';

export const MessageList = memo(({ messages }: { messages: Message[] }) => {
  const sortedMessages = useMemo(
    () => messages.sort((a, b) => b.timestamp - a.timestamp),
    [messages]
  );

  const handlePress = useCallback((id: string) => {
    // Handle press
  }, []);

  return (
    <FlatList
      data={sortedMessages}
      renderItem={({ item }) => (
        <MessageBubble message={item} onPress={handlePress} />
      )}
      keyExtractor={(item) => item.id}
    />
  );
});
```

**Performance Rules:**
- ✅ Memoize expensive computations with `useMemo`
- ✅ Memoize callbacks with `useCallback`
- ✅ Memoize components with `memo` (when appropriate)
- ✅ Use `FlatList` for long lists (not ScrollView)
- ✅ Lazy load images with `expo-image`
- ✅ Optimize animations with `react-native-reanimated`

---

## 🔐 Security Rules

### API Key Safety

```typescript
// ✅ CORRECT - Server-side API calls
// Never expose service keys on client

// Client-side: Call your backend
const generateImage = async (prompt: string) => {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return response.json();
};

// Backend: Use API keys safely
// (In your Python backend or Supabase Edge Functions)
```

**Security Rules:**
- ✅ Never log API keys
- ✅ Never commit `.env.local`
- ✅ Use Supabase RLS (Row Level Security)
- ✅ Validate all user inputs
- ✅ Sanitize data before rendering
- ✅ Use HTTPS for all API calls

---

## 📱 Platform-Specific Code

### Handling Platform Differences

```typescript
// ✅ CORRECT - Platform-specific code
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
});
```

**Platform Rules:**
- ✅ Test on iOS, Android, and Web
- ✅ Use `Platform.select()` for platform-specific styles
- ✅ Use `Platform.OS` for platform-specific logic
- ✅ Provide fallbacks for web

---

## 🎯 AI Development Guidelines

### For AI Assistants (Cursor, Claude, GPT-5 Codex)

When generating code for this project:

1. **Read Context First**
   - Check `.context/` directory for patterns
   - Review existing similar components
   - Follow established conventions

2. **Apply BMAD Rules**
   - Use glassmorphism for all UI
   - Add haptic feedback to interactions
   - Use Zustand for feature state
   - Follow service layer pattern

3. **Maintain Consistency**
   - Match existing code style
   - Use same naming conventions
   - Follow same file structure
   - Respect monorepo boundaries

4. **Type Safety**
   - Always use TypeScript
   - Define proper interfaces
   - No `any` types
   - Import types correctly

5. **Test Awareness**
   - Code should work on iOS, Android, Web
   - Support light and dark themes
   - Handle loading and error states
   - Include proper error boundaries

---

## ✅ Checklist for New Features

Before implementing any new feature, ensure:

- [ ] Feature lives in correct app directory
- [ ] Uses glassmorphism UI pattern
- [ ] Includes haptic feedback
- [ ] Supports light/dark themes
- [ ] Has proper TypeScript types
- [ ] Uses Zustand store for state
- [ ] API calls go through service layer
- [ ] Follows naming conventions
- [ ] Imports use @ alias
- [ ] No console.log statements
- [ ] No hardcoded colors
- [ ] Handles loading states
- [ ] Handles error states
- [ ] Tested on multiple platforms
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## 📚 Reference Files

### Must-Read Files for Context

```
/MONOREPO_GUIDE.md              # Monorepo structure
/apps/happiness-app/constants/DesignSystem.ts  # Design tokens
/apps/happiness-app/constants/Theme.ts         # Theme system
/packages/shared-config/index.js               # Environment config
/.context/patterns.md           # Code patterns
/.context/examples/             # Example implementations
```

---

## 🔄 Version History

- **v1.0.0** (Dec 3, 2025) - Initial BMAD rules after monorepo restructure

---

**Remember:** These rules exist to maintain consistency, quality, and developer velocity. When in doubt, reference existing code in `apps/happiness-app/` as the source of truth.
