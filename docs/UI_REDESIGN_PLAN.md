# UI Redesign Plan - Manus AI Aesthetic

_Created: 2025-10-06_

## Vision

Transform Happiness into a **premium, delightful AI companion** matching the craft quality of Manus.AI, Claude, and Arc. The UI should feel **fluid, minimal, and emotionally intelligent** - animations that breathe, typography that sings, and interactions that delight.

## Core Design Principles (from PRD)

1. **Delightful craft** - Premium app quality (Manus.AI, Claude, Arc)
2. **Fluid animations** - Waveforms, particle trails, parallax, springy cards
3. **Contextually aware** - UI adapts to time, mood, energy, location
4. **Multi-modal** - Voice, text, camera with Snapchat-style filters
5. **Privacy-forward** - Stealth modes, explicit consent

## Current State Analysis

### What's Working
- Basic tab structure (Profile, Chat, Library, Planner)
- Supabase auth + data layer
- RAG memory system
- Multi-agent architecture (alter_ego orchestration)
- Reanimated 3 setup

### What Needs Transformation
- ❌ **Voice UI**: Static gradients with emojis (too robotic, not Manus AI quality)
- ❌ **Chat bubbles**: Basic iOS-style messages (need Claude-level polish)
- ❌ **Animations**: Simple fade-ins (need waveforms, particle trails, breathing)
- ❌ **Voice tech**: Using expo-speech TTS (robotic) - need OpenAI gpt-realtime API
- ❌ **Typography**: Inconsistent sizing and hierarchy
- ❌ **Color system**: Basic blues - need sophisticated gradient palette
- ❌ **Micro-interactions**: Missing haptics, sound, depth

## Design System

### Color Palette (Premium Gradients)

```typescript
// Primary brand gradients
const GRADIENTS = {
  // alter_ego identity - calm, trustworthy
  primary: {
    colors: ['#667eea', '#764ba2'],  // Purple → Deep Purple
    angle: 135,
  },

  // Voice listening - sky blue (calm attention)
  listening: {
    colors: ['#4A90E2', '#87CEEB', '#B4D7F1'],
    angle: 180,
  },

  // Processing/thinking - vibrant purple
  thinking: {
    colors: ['#667eea', '#8B5CF6', '#A78BFA'],
    angle: 90,
  },

  // Speaking - soft green (friendly, safe)
  speaking: {
    colors: ['#10B981', '#34D399', '#6EE7B7'],
    angle: 180,
  },

  // Morning energy
  morning: {
    colors: ['#f7f8ff', '#eef6ff', '#ebfffa'],
    angle: 180,
  },

  // Evening calm
  evening: {
    colors: ['#2D3142', '#4F5D75', '#687A96'],
    angle: 135,
  },

  // Success/wellness
  success: {
    colors: ['#06D6A0', '#118AB2', '#073B4C'],
    angle: 135,
  },

  // Crisis/alert (subtle)
  alert: {
    colors: ['#FF6B6B', '#EE5A6F', '#C73E63'],
    angle: 135,
  },
};

// Neutrals
const COLORS = {
  // Light mode
  background: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFBFF',

  // Text
  text: {
    primary: '#1B1F33',
    secondary: '#4A4F6A',
    tertiary: '#6B7190',
    disabled: '#8A90A8',
  },

  // Borders
  border: {
    light: '#E8EBEF',
    medium: '#D6DCF5',
    strong: '#C0C7DD',
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};
```

### Typography Scale

```typescript
const TYPOGRAPHY = {
  // Display
  hero: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    letterSpacing: -1.2,
  },

  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: 0,
  },

  // Body
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Labels
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: 0.3,
  },

  // Voice state labels
  voiceState: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
};
```

### Spacing System

```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
};
```

### Animation Presets

```typescript
const ANIMATIONS = {
  // Spring configurations
  spring: {
    gentle: { damping: 20, stiffness: 150 },
    bouncy: { damping: 10, stiffness: 200 },
    snappy: { damping: 15, stiffness: 300 },
  },

  // Timing configurations
  timing: {
    fast: { duration: 200 },
    normal: { duration: 300 },
    slow: { duration: 500 },
    breathe: { duration: 2000 },
  },

  // Delays
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  },
};
```

## Screen-by-Screen Redesign

### 1. Chat / alter_ego (PRIMARY FOCUS)

**Current Issues:**
- Voice UI with emoji icons (not premium)
- Static gradient circles
- No waveform visualization
- Robotic TTS (expo-speech)
- Basic chat bubbles

**Redesign:**

#### Voice Interface (Manus AI Quality)
- **Large fluid orb** (180px diameter, not 120px)
- **Siri-style waveform** - 7 bars (not 5) with mirrored sine wave effect
- **Breathing animation** in idle - subtle scale 1.0 → 1.05 over 3s
- **Particle effects** when transitioning states
- **Blur backdrop** behind orb (frosted glass effect)
- **Dynamic gradients** that shift based on emotion/context
- **Haptic patterns** - different for each state transition
- **Sound effects** - subtle chimes for state changes

#### Chat Bubbles (Claude Quality)
- **Larger, more spacious** - 16px padding (not 14px)
- **Smooth shadows** with colored tints based on sender
- **Typing indicator** - 3 animated dots with bounce effect
- **Streaming text** - character-by-character reveal with slight fade-in
- **Markdown support** - bold, italic, code blocks with syntax highlighting
- **Long-press actions** - copy, delete, retry (with haptic)

#### Composer
- **Voice button prominence** - larger, always visible
- **Microphone waveform** showing audio level while recording
- **Suggested responses** - chips that animate in after AI response
- **Quick actions** - camera, library, mood (with icons, not text)

### 2. Profile (Home)

**Current Issues:**
- Static gradient header
- Basic card layout
- No parallax or depth
- Limited contextual awareness

**Redesign:**

#### Hero Header
- **Parallax scrolling** - header moves slower than content
- **Time-based gradient** - shifts from morning blues → evening purples
- **Energy visualization** - subtle animated waves showing user's energy trend
- **Greeting animation** - text fades in with character stagger
- **Weather integration** (future) - subtle weather particles

#### Contextual Feed Cards
- **3D tilt effect** on cards when scrolling
- **Shimmer loading** - skeleton with gradient sweep
- **Priority indicators** - colored left border that pulses for urgent items
- **Thumbnail previews** - for media/video content
- **Swipe actions** - dismiss, snooze, save (with haptic feedback)

#### Mini Planner
- **Progress rings** - circular progress for each goal
- **Timeline visualization** - horizontal timeline with draggable markers
- **Smart badges** - "Due soon", "Energy optimal", "Suggested time"

### 3. Library

**Current Issues:**
- Not yet implemented
- Need Instagram-quality grid

**Redesign:**

#### Media Grid (Instagram-style)
- **Masonry layout** - varying heights for visual interest
- **Lazy loading** with blur-up technique
- **Pinch to zoom** - smooth spring animation
- **Shared element transitions** - when opening media detail
- **Filter chips** - horizontal scrolling filters with active state
- **Search bar** - animated expand/collapse

#### Meeting Minutes
- **Timeline view** - vertical timeline with speaker avatars
- **Waveform thumbnail** - mini waveform showing audio structure
- **AI highlights** - key points with colored backgrounds
- **Action items** - checkboxes with completion animation

### 4. Planner

**Current Issues:**
- Basic task list
- No visual timeline
- Limited goal tracking

**Redesign:**

#### Goal Dashboard
- **Circular progress cards** - large circles showing completion %
- **Streak tracking** - calendar heatmap (GitHub-style)
- **AI insights panel** - "You're 15% ahead of your usual pace"
- **Motivational quotes** - contextual, based on progress

#### Zoomable Timeline
- **Horizontal scroll** - pinch to zoom in/out
- **Milestones** - larger nodes on timeline
- **Dependencies** - connected lines between related tasks
- **Drag to reorder** - with haptic confirmation

## Voice Technology: OpenAI gpt-realtime

### Why gpt-realtime (not ElevenLabs)

**Advantages:**
1. **Native conversation** - handles turn-taking, interruptions automatically
2. **Lower latency** - WebSocket streaming, no transcription lag
3. **Better quality** - New voices (Marin, Cedar) with emotion
4. **Cost effective** - 20% cheaper than gpt-4o-realtime
5. **Function calling** - can trigger tools while speaking
6. **Context awareness** - knows conversation history natively

**Implementation:**
- WebSocket connection to `wss://api.openai.com/v1/realtime`
- Audio streaming (PCM16, 24kHz sample rate)
- Session config with voice, temperature, turn detection
- Event handling: `response.audio.delta`, `response.text.delta`

### React Native Integration

**Requirements:**
1. `react-native-webrtc` - for WebRTC support
2. `expo-av` - for audio playback
3. `@react-native-community/audio-toolkit` - for recording
4. Polyfills for ReadableStream

**Architecture:**
```
User speaks → Audio Recording → PCM16 encoding → WebSocket send
              ↓
OpenAI gpt-realtime processes (with RAG context from Supabase)
              ↓
WebSocket receive ← Audio chunks ← TTS generation ← AI response
              ↓
Audio playback with waveform visualization
```

## Implementation Priority

### Phase 1: Voice Foundation (Week 1)
1. ✅ Create design system constants file
2. ⬜ Implement OpenAI gpt-realtime WebSocket client
3. ⬜ Rebuild VoiceChat component with premium animations
4. ⬜ Test natural conversation flow

### Phase 2: Chat Polish (Week 1-2)
1. ⬜ Redesign chat bubbles with shadows and spacing
2. ⬜ Add typing indicator with animation
3. ⬜ Implement streaming text reveal
4. ⬜ Add long-press actions with haptics

### Phase 3: Profile & Navigation (Week 2)
1. ⬜ Parallax header implementation
2. ⬜ 3D card tilt effects
3. ⬜ Shimmer loading states
4. ⬜ Contextual animations based on time/mood

### Phase 4: Library & Planner (Week 3)
1. ⬜ Instagram-style media grid
2. ⬜ Shared element transitions
3. ⬜ Zoomable timeline for planner
4. ⬜ Progress visualizations

### Phase 5: Micro-interactions (Week 3-4)
1. ⬜ Haptic feedback patterns
2. ⬜ Sound effects
3. ⬜ Gesture recognizers
4. ⬜ Accessibility features

## Success Metrics

**Qualitative:**
- Users describe UI as "delightful", "premium", "fluid"
- Voice conversations feel natural (not robotic)
- Animations enhance understanding (not distract)

**Quantitative:**
- Voice session length increases (>2 minutes average)
- Chat engagement increases (>10 messages per session)
- Retention improves (>50% day 7 retention)
- App Store rating >4.5 with UI praise in reviews

## References

- [OpenAI gpt-realtime announcement](https://openai.com/index/introducing-gpt-realtime/)
- PRD: Section 3 (Experience Architecture)
- Inspiration: Manus.AI, Claude, ChatGPT Voice Mode, Arc Browser
- Animation library: Reanimated 3 docs
- Voice patterns: Siri, Google Assistant, Alexa

---

This redesign transforms Happiness from a functional prototype into a **premium AI companion** that matches the craft quality users expect from Manus.AI and Claude.
