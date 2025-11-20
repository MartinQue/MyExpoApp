# Happiness App - Figma Design Brief

**For:** Figma UI/UX Designer  
**Project:** Happiness AI Companion App  
**Platform:** iOS (iPhone), later Android  
**Timeline:** Design needed in 1-2 weeks  
**Date:** November 2025

---

## Project Overview

Happiness is an AI-powered personal companion app that helps users with goal planning, wellness, journaling, and content creation. Think of it as a combination of:
- **Grok AI** (conversational interface, animated avatar)
- **Notion** (organization, notes)
- **Calm** (wellness, mood tracking)
- **ChatGPT** (AI conversations)

The app features an **animated 2D avatar companion** named "alter_ego" who talks with users via voice and text, remembers everything, and helps them achieve their goals.

---

## Design Philosophy

### Visual Style: **Grok-Inspired Dark Premium**

- **Primary inspiration:** Grok AI iOS app (X's AI chatbot)
- **Aesthetic:** Dark theme, glass morphism, sophisticated shadows
- **Feel:** Professional yet warm, futuristic yet approachable
- **Colors:** Deep blacks, subtle grays, accent blues
- **Animations:** Smooth 60fps, micro-interactions everywhere

### Key Design Principles

1. **Premium Quality:** Every pixel matters - this should feel like a $10/month product
2. **Emotional Connection:** Warm, inviting, makes users feel cared for
3. **Clarity:** Clear hierarchy, obvious actions, no confusion
4. **Delight:** Subtle animations, haptic feedback, satisfying interactions
5. **Accessibility:** High contrast, large touch targets (44px min), readable text

---

## App Structure (5 Main Tabs)

### Bottom Tab Navigation
```
┌─────────────────────────────────────┐
│                                     │
│         [Tab Content Here]          │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏠    💬    ✨    📚    🎯       │
│ Home  Chat Create Library Goals    │
└─────────────────────────────────────┘
```

**Tabs (left to right):**
1. **Home/Profile** - Contextual feed, avatar companion
2. **Chat** - AI conversations (Grok-style interface)
3. **Imagination** - AI image/video generation
4. **Library** - Media & notes archive
5. **Planner** - Goals & tasks management

---

## Screen-by-Screen Design Requirements

### 1️⃣ CHAT TAB (Primary Focus - Design This First!)

**Reference:** Grok AI chat interface

#### Input Bar (Most Critical!)
This is THE most important design element. Must match Grok quality exactly.

**Specifications:**
- **Background:** Dark gray `#1C1C1E` (Grok's exact color)
- **Height:** 56-60px minimum, expands to 120px max when typing
- **Border Radius:** 28px (fully rounded pill shape)
- **Shadow:** Deep, prominent shadow for elevation
  - `shadowColor: #000`
  - `shadowOffset: { width: 0, height: 4 }`
  - `shadowOpacity: 0.3`
  - `shadowRadius: 12`
- **Padding:** 14px horizontal, 10px vertical
- **Position:** Fixed at bottom with safe area padding

**Internal Layout (left to right):**
```
┌──────────────────────────────────────────────┐
│ 📎  [💡 Expert ▼]  Ask Anything...  [Speak] │
│ 44px   120px         flex-1        100px    │
└──────────────────────────────────────────────┘
```

1. **Attach Button (📎)**
   - Icon: Paper clip
   - Size: 22px
   - Color: `#898B8E` (light gray)
   - Touch area: 44x44px
   - Haptic feedback: Light impact

2. **Expert Dropdown (Optional - can skip for MVP)**
   - Background: `rgba(255,255,255,0.08)`
   - Padding: 12px horizontal, 8px vertical
   - Border radius: 20px
   - Icon + text + chevron
   - Text: "Expert" in 14px medium weight

3. **Text Input**
   - Placeholder: "Ask Anything"
   - Placeholder color: `#6B7280`
   - Text color: `#FFFFFF`
   - Font size: 16px
   - Multi-line (auto-expands)
   - No border/background

4. **Speak Button (Primary CTA)**
   - Background: `#FFFFFF` (white)
   - Text: "Speak" in `#000000` (black)
   - Font weight: 600 (semi-bold)
   - Padding: 18px horizontal, 12px vertical
   - Border radius: 24px (pill)
   - Icon: Microphone (20px) + text
   - Shadow (subtle glow):
     - `shadowColor: #FFFFFF`
     - `shadowOpacity: 0.2`
     - `shadowRadius: 4`
   - **When typing:** Replace with blue circle send button
     - 40x40px circle
     - Blue background `#3B82F6`
     - White arrow-up icon

**Focus State:**
- When tapped, add 2px border in blue `#3B82F6`
- Increase shadow (glow effect)

#### Action Pills (Above Input Bar)
Only show when chat is empty (no messages yet).

**Layout:** Horizontal scrollable row
```
┌──────────────────────────────────────────────┐
│  [Get Premium]  [Voice Mode]  [Create] [📷] │
│     Primary       Default      Default  Icon│
└──────────────────────────────────────────────┘
```

**Pill Specifications:**
- **Default pill:**
  - Background: `#0D0F10` (dark card)
  - Border: 1px `#2E3236`
  - Padding: 20px horizontal, 14px vertical
  - Border radius: 28px
  - Gap between icon & text: 8px
  - Text: 15px, weight 600

- **Primary pill (Get Premium):**
  - Background: `#3B82F6` (blue)
  - No border
  - Padding: 22px horizontal, 16px vertical (slightly larger)
  - Text: White, 16px, weight 700

**Pills:**
1. "Get Premium" - ⚡ icon
2. "Voice Mode" - 🎤 icon
3. "Create Videos" - 🎬 icon
4. "Open Camera" - 📷 icon

#### Message Bubbles

**User Messages (Right-aligned):**
- Background: `#212327` (dark gray)
- Text: `#FFFFFF` (white)
- Max width: 80% of screen
- Border radius: 18px (top-left, top-right, bottom-left), 4px (bottom-right)
- Padding: 16px horizontal, 12px vertical
- Timestamp below (small, gray, 12px)

**AI Messages (Left-aligned):**
- Background: `#0D0F10` (darker)
- Text: `#898B8E` (light gray)
- Avatar icon on left (32x32px circle)
- Same border radius (mirrored)
- Typing indicator: 3 animated dots

#### Empty State
- Large "H" logo in circle (120x120px)
- Centered vertically
- Subtle glow effect around logo

**Design Deliverables for Chat:**
1. Input bar (default state)
2. Input bar (focused state)
3. Input bar (typing state with send button)
4. Action pills (all 4 variations)
5. Message bubbles (user + AI examples)
6. Empty state with logo
7. Typing indicator animation frames

---

### 2️⃣ HOME/PROFILE TAB

**Purpose:** Dynamic feed that changes based on time, mood, goals

#### Layout Structure
```
┌─────────────────────────────────┐
│ ☀️ Good morning!               │ ← Greeting (time-based)
│                                 │
│ ┌───────────────────────────┐  │
│ │ 💪 Keep Going!            │  │ ← Motivational card
│ │ You're on a 3-day streak  │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌───────────────────────────┐  │
│ │ 📸 [Image Thumbnail]      │  │ ← Recent memory
│ │ Yesterday's workout       │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌───────────────────────────┐  │
│ │ 🎯 See what's up next →   │  │ ← Planner preview
│ │ 3 tasks due today         │  │
│ └───────────────────────────┘  │
│                                 │
│ [More cards scroll...]         │
└─────────────────────────────────┘
```

**Card Specifications:**
- Background: `#0D0F10`
- Border: 1px `#2E3236`
- Border radius: 24px
- Padding: 16px
- Shadow: Subtle (elevation 2)
- Gap between cards: 16px

**Card Types to Design:**
1. **Motivational Quote Card**
   - Large emoji/icon
   - Quote text (18px)
   - Source (small, gray)

2. **Goal Progress Card**
   - Title
   - Progress bar (colored)
   - Percentage + "of goal"

3. **Media Memory Card**
   - Image thumbnail (cover)
   - Caption below
   - Tag badges

4. **Wellness Check Card**
   - "How are you feeling?"
   - 5 emoji buttons (😄 😊 😐 😔 😢)

5. **Next Task Card**
   - "See what's up next →"
   - Task preview
   - Tap to navigate to Planner

**Design Deliverables:**
1. Greeting header (4 variations: morning/afternoon/evening/night)
2. All 5 card types
3. Empty state (first time user)
4. Pull-to-refresh animation

---

### 3️⃣ AVATAR COMPANION SCREEN

**Accessed by:** Swiping LEFT from Chat tab

**Layout:** Full-screen immersive experience
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         [Large Avatar]          │ ← 90% of screen height
│       (Animated Lottie)         │
│                                 │
│                                 │
│                                 │
│ ┌────────────────────────────┐ │
│ │ 🎤 Tap to talk...          │ │ ← Same input bar
│ └────────────────────────────┘ │
└─────────────────────────────────┘
```

**Background:**
- Gradient based on time of day
  - Morning: Warm oranges/yellows
  - Day: Sky blues
  - Evening: Sunset oranges/purples
  - Night: Deep blues/purples
- Smooth animated transitions between gradients

**Avatar Placement:**
- Centered horizontally
- Top 10% from screen top
- Size: 80-90% of screen width (massive!)

**Avatar States to Design:**
1. **Idle** - Gentle breathing, blinking
2. **Listening** - Attentive, focused
3. **Speaking** - Mouth moving, gestures
4. **Thinking** - Processing, contemplative

**Design Deliverables:**
1. Background gradients (4 time periods)
2. Avatar frame/container
3. Companion selection modal (see below)
4. Swipe gesture indicator (first time)

---

### 4️⃣ COMPANION SELECTION MODAL

**Triggered by:** Settings or first launch

**Layout:** Bottom sheet modal
```
┌─────────────────────────────────┐
│ Choose Your Companion           │
│                                 │
│ ┌───────┐ ┌───────┐ ┌───────┐ │
│ │[Avatar]│ │[Avatar]│ │[Avatar]│ │
│ │alter  │ │ Lumen │ │ Noir  │ │
│ │ _ego  │ │       │ │       │ │
│ └───────┘ └───────┘ └───────┘ │
│                                 │
│ ┌───────┐                      │
│ │ 🔒    │ ← Locked (Premium)  │
│ │Premium│                      │
│ └───────┘                      │
│                                 │
│       [Continue →]              │
└─────────────────────────────────┘
```

**Card Specifications:**
- Glass morphism effect
- Background: `rgba(255,255,255,0.05)`
- Border: 1px `rgba(255,255,255,0.1)`
- Backdrop blur: 20px
- Padding: 16px
- Border radius: 24px
- Avatar preview (120x120px)
- Name below (16px, weight 600)
- Short description (12px, gray)

**Selected State:**
- Blue border (2px, `#3B82F6`)
- Blue glow shadow
- Scale up slightly (1.05x)

**Design Deliverables:**
1. Modal background (dimmed overlay)
2. Companion cards (4 total)
3. Selected state
4. Locked state (premium)
5. Continue button

---

### 5️⃣ LIBRARY TAB

**Purpose:** Media gallery + notes archive

#### Top Toggle
```
┌─────────────────────────────────┐
│  Personal  |  Notes              │
│  ────────                        │
└─────────────────────────────────┘
```

**Toggle Specs:**
- Underline indicator (3px, blue)
- Text: 17px, weight 600 (active), 400 (inactive)
- Smooth slide animation

#### Personal View (Media Grid)
```
┌─────────────────────────────────┐
│ ┌────┐ ┌────┐ ┌────┐           │
│ │IMG │ │VID │ │IMG │           │
│ └────┘ └────┘ └────┘           │
│ ┌────┐ ┌────┐ ┌────┐           │
│ │AUD │ │IMG │ │VID │           │
│ └────┘ └────┘ └────┘           │
└─────────────────────────────────┘
```

**Grid Item:**
- Square aspect ratio
- Gap: 8px
- Border radius: 12px
- Type badge (top-right):
  - IMAGE: Blue `#3B82F6`
  - VIDEO: Purple `#8B5CF6`
  - AUDIO: Green `#10B981`
- Play icon overlay for videos
- Duration overlay for audio

#### Notes View (List)
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐│
│ │ Morning Reflection          ││
│ │ Feeling energized today...  ││
│ │ 2h ago  •  #wellness        ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │ Meeting Notes               ││
│ │ Discussed new features...   ││
│ │ Yesterday  •  #work         ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Note Card:**
- Background: `#0D0F10`
- Border: 1px `#2E3236`
- Padding: 16px
- Border radius: 18px
- Title: 18px, weight 600
- Preview: 14px, gray, 2 lines max
- Meta: 12px, light gray (time + tags)

**Design Deliverables:**
1. Toggle component (both states)
2. Media grid (with different media types)
3. Note card (multiple examples)
4. Empty states (no media, no notes)
5. Search bar
6. Filter chips

---

### 6️⃣ PLANNER TAB

**Purpose:** Goal & task management

#### Goal Overview
```
┌─────────────────────────────────┐
│ 🎯 Your Goals                   │
│                                 │
│ ┌─────────────────────────────┐│
│ │ 🏋️ Get Fit                 ││
│ │ ████████░░ 65%              ││
│ │ 3 tasks due this week       ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │ 📚 Learn Spanish            ││
│ │ ████░░░░░░ 30%              ││
│ │ 5 tasks due this week       ││
│ └─────────────────────────────┘│
│                                 │
│        [+ Add Goal]             │
└─────────────────────────────────┘
```

**Goal Card:**
- Emoji icon (large, 32px)
- Title (20px, weight 600)
- Progress bar (full width, 8px height, rounded)
  - Background: `#2E3236`
  - Fill: Blue `#3B82F6`
- Subtitle: Tasks due (14px, gray)

#### Goal Detail (Timeline)
```
┌─────────────────────────────────┐
│ ← Get Fit                       │
│                                 │
│ Week 1 ✓ COMPLETED              │
│ ├─ Task 1 ✓                    │
│ ├─ Task 2 ✓                    │
│ └─ Task 3 ✓                    │
│                                 │
│ Week 2 ⏳ IN PROGRESS           │
│ ├─ Task 4 ✓                    │
│ ├─ Task 5 ⏳ (Due today)       │
│ └─ Task 6 ⬜                   │
│                                 │
│ Week 3                          │
│ └─ Tasks locked                 │
└─────────────────────────────────┘
```

**Timeline Item:**
- Vertical line connecting items
- Checkboxes (24x24px)
  - ✓ Completed: Blue with white check
  - ⏳ In progress: Orange ring
  - ⬜ Not started: Gray outline
- Task text (16px)
- Due date (small, gray)

**Design Deliverables:**
1. Goal cards (multiple examples)
2. Progress bar component
3. Timeline view (all states)
4. Task checkboxes (all states)
5. Add goal button
6. Empty state (no goals)

---

### 7️⃣ IMAGINATION TAB

**Purpose:** AI image/video generation

```
┌─────────────────────────────────┐
│ Create Something Amazing ✨     │
│                                 │
│ ┌────────────────────────────┐ │
│ │ [Upload 1] [Upload 2]      │ │
│ │ [Upload 3]                 │ │
│ │ + Add Photo                │ │
│ └────────────────────────────┘ │
│                                 │
│ What do you want to create?    │
│ ┌────────────────────────────┐ │
│ │ Describe your vision...    │ │
│ │                            │ │
│ └────────────────────────────┘ │
│                                 │
│ Style: [Realistic ▼]           │
│                                 │
│ [Generate Image] [Generate Video]│
└─────────────────────────────────┘
```

**Upload Boxes:**
- Dashed border (2px, `#2E3236`)
- Border radius: 18px
- Size: 100x100px
- Plus icon when empty
- Image preview when uploaded
- Delete button (top-right X)

**Text Input:**
- Multi-line
- Min height: 100px
- Same styling as chat input
- Character count (bottom-right)

**Generate Buttons:**
- Primary: Blue gradient
- Secondary: Dark outline
- Full width
- Height: 56px
- Border radius: 16px
- Icon + text

**Design Deliverables:**
1. Upload area (empty + filled)
2. Text input
3. Style dropdown
4. Generate buttons
5. Loading state (generating...)
6. Result preview
7. Paywall modal (upgrade)

---

### 8️⃣ SETTINGS SCREEN

**Navigation:** Accessible from profile icon (top-right)

```
┌─────────────────────────────────┐
│ ← Settings                      │
│                                 │
│ Account                         │
│ ├─ Profile                      │
│ ├─ Email                        │
│ └─ Password                     │
│                                 │
│ Privacy & Safety                │
│ ├─ Data Usage                   │
│ ├─ Delete Account               │
│ └─ Privacy Mode        [Toggle] │
│                                 │
│ Notifications          [Toggle] │
│                                 │
│ Voice & Audio                   │
│ ├─ Voice Selection              │
│ └─ Always Listening    [Toggle] │
│                                 │
│ Subscription                    │
│ ├─ Current: Free                │
│ └─ Upgrade to Premium           │
│                                 │
│ About                           │
│ └─ Version 1.0.0                │
└─────────────────────────────────┘
```

**Section Headers:**
- Text: 14px, uppercase, weight 700, gray
- Margin: 24px top, 8px bottom

**Setting Rows:**
- Height: 56px
- Padding: 16px
- Border bottom: 1px `#2E3236`
- Chevron right (for sub-menus)
- Toggle switches (iOS native style)

**Toggle Switches:**
- iOS native component
- On color: Blue `#3B82F6`
- Off color: `#2E3236`

**Design Deliverables:**
1. Settings list (all sections)
2. Toggle component
3. Section headers
4. Destructive action (delete account)

---

### 9️⃣ VOICE MODAL

**Full-screen takeover when "Speak" button tapped**

```
┌─────────────────────────────────┐
│  ✕                              │
│                                 │
│    Ready and listening          │
│                                 │
│      ╱▔▔▔▔▔▔▔▔▔╲              │
│     ▕ ～～～～～ ▏             │
│      ╲_________╱               │
│                                 │
│  [Transcription appears here]   │
│                                 │
│                                 │
│   [Mic icon pulsing]           │
└─────────────────────────────────┘
```

**Background:**
- Dark gradient (black to dark gray)
- Blur effect

**Waveform:**
- Animated based on audio amplitude
- Color: Blue `#3B82F6` (listening), Purple `#8B5CF6` (AI speaking)
- Smooth 60fps animation

**Status Text:**
- Top center
- 18px, weight 600
- States: "Ready and listening", "Thinking...", "Speaking..."

**Transcription:**
- Center of screen
- 20px, weight 400
- Animated typing effect

**Mic Icon:**
- Bottom center (64x64px)
- Pulsing animation
- Tap to pause/resume

**Design Deliverables:**
1. Voice modal (all states)
2. Waveform animation frames
3. Pulsing mic animation
4. Close button

---

### 🔟 ADDITIONAL COMPONENTS

#### Crisis Resource Card
Shown when AI detects user in distress.

```
┌─────────────────────────────────┐
│ ❤️ We're here for you          │
│                                 │
│ If you're in crisis, please    │
│ reach out to professionals:     │
│                                 │
│ ┌─────────────────────────────┐│
│ │ 📞 988 Suicide Lifeline     ││
│ │ Call or text, 24/7          ││
│ └─────────────────────────────┘│
│                                 │
│ ┌─────────────────────────────┐│
│ │ 💬 Text HOME to 741741      ││
│ │ Crisis Text Line            ││
│ └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Card Style:**
- Warning color background `rgba(239, 68, 68, 0.1)` (red tint)
- Border: 2px red `#EF4444`
- Urgent but caring tone

#### Loading States (Skeletons)
For all screens while data loads.

**Skeleton Properties:**
- Background: `#0D0F10`
- Shimmer effect (animated gradient)
- Border radius: Match actual components

#### Toast Notifications
For success/error messages.

```
┌────────────────────┐
│ ✓ Goal created!    │
└────────────────────┘
```

- Appears from top
- Auto-dismiss after 3s
- Success: Green background
- Error: Red background
- Info: Blue background

---

## Design System Summary

### Color Palette
```
Backgrounds:
#000000 - Pure black (main background)
#0D0F10 - Dark card
#1C1C1E - Input bar, modals
#212327 - User message bubble

Borders:
#2E3236 - Subtle borders

Text:
#FFFFFF - Primary text
#898B8E - Secondary text
#6B7280 - Tertiary text (placeholder)

Accents:
#3B82F6 - Primary blue (actions, progress)
#10B981 - Success green
#F59E0B - Warning orange
#EF4444 - Error red
#8B5CF6 - Purple (AI features)
```

### Typography Scale
```
H1: 32px / Bold (700)
H2: 24px / Semibold (600)
H3: 20px / Semibold (600)
Body: 16px / Regular (400)
Small: 14px / Regular (400)
Tiny: 12px / Medium (500)

Font: SF Pro (iOS system font)
```

### Spacing Scale
```
4px  - xs (micro gaps)
8px  - sm (tight spacing)
16px - md (standard gap)
24px - lg (section spacing)
32px - xl (major sections)
48px - xxl (page margins)
```

### Border Radius
```
8px   - sm (small elements)
12px  - md (cards, media)
18px  - lg (message bubbles)
24px  - xl (large cards)
28px  - input bar
9999px - pill (fully rounded)
```

### Shadows (iOS Elevation)
```
Small:
  shadowColor: #000
  shadowOffset: 0, 2
  shadowOpacity: 0.05
  shadowRadius: 4
  elevation: 2

Medium:
  shadowColor: #000
  shadowOffset: 0, 4
  shadowOpacity: 0.1
  shadowRadius: 8
  elevation: 4

Large (Input Bar):
  shadowColor: #000
  shadowOffset: 0, 4
  shadowOpacity: 0.3
  shadowRadius: 12
  elevation: 8
```

---

## Animation Specifications

### Micro-Interactions
- **Button Press:** Scale 0.95x, 100ms
- **Tab Switch:** Slide + fade, 300ms
- **Modal Open:** Slide up + fade, 400ms ease-out
- **Card Reveal:** Fade + slide up, 300ms stagger 50ms

### Loading Animations
- **Skeleton Shimmer:** 1.5s loop, linear gradient sweep
- **Spinner:** 1s rotation, ease-in-out
- **Typing Indicator:** 3 dots, 600ms pulse

### Haptic Feedback Mapping
- Light impact: Tap buttons, toggle switches
- Medium impact: Send message, complete task
- Heavy impact: Achieve milestone, level up
- Success: Goal completed
- Warning: Error occurred
- Error: Delete action

---

## Screen Sizes to Design For

**Primary:**
- iPhone 15 Pro (6.1" - 393 x 852 pts)
- iPhone 15 Pro Max (6.7" - 430 x 932 pts)

**Secondary:**
- iPhone SE (4.7" - 375 x 667 pts)

**Safe Areas:**
- Top: 47-59px (status bar + notch)
- Bottom: 34px (home indicator)
- Sides: 0px

---

## Deliverables Checklist

### Phase 1: Core Screens (Priority)
- [ ] Chat tab (input bar + all states)
- [ ] Message bubbles (user + AI)
- [ ] Action pills (4 variations)
- [ ] Empty state
- [ ] Avatar companion screen
- [ ] Companion selection modal
- [ ] Home/Profile feed (5 card types)

### Phase 2: Remaining Tabs
- [ ] Library (media grid + notes list)
- [ ] Planner (goals + timeline)
- [ ] Imagination (creation interface)
- [ ] Settings (all sections)

### Phase 3: Modals & Overlays
- [ ] Voice modal (all states)
- [ ] Crisis resource card
- [ ] Paywall modal
- [ ] Onboarding screens (4 screens)

### Phase 4: Components & States
- [ ] Loading skeletons (all screens)
- [ ] Toast notifications
- [ ] Empty states (all tabs)
- [ ] Error states

### Phase 5: Icons & Assets
- [ ] App icon (1024x1024)
- [ ] Tab bar icons (5 icons, active + inactive)
- [ ] Splash screen
- [ ] Logo variations

---

## File Organization Request

Please organize Figma file as:

```
📁 Happiness App
  📄 Cover (Project overview)
  📄 Design System
    - Colors
    - Typography
    - Components
    - Icons
  📄 01 - Chat
  📄 02 - Home/Profile
  📄 03 - Avatar Companion
  📄 04 - Library
  📄 05 - Planner
  📄 06 - Imagination
  📄 07 - Settings
  📄 08 - Modals
  📄 09 - States (Loading, Empty, Error)
  📄 Prototype (Interactive flow)
```

---

## Collaboration Process

### Communication
- **Questions:** Ask in Figma comments or via email
- **Feedback:** We'll review and provide feedback in Figma
- **Iterations:** 2-3 rounds expected

### Timeline
- **Week 1:** Core screens (Chat, Home, Avatar)
- **Week 2:** Remaining tabs + components
- **Review:** Mid-week check-ins

### Handoff
- Export assets as PNG @2x, @3x
- Provide design specs (Inspect mode)
- Share prototype link
- Document any special interactions

---

## Questions for Designer

Before starting, please confirm:

1. Do you have access to Grok AI app for reference?
2. Are you comfortable with dark theme design?
3. Do you have experience with iOS design patterns?
4. Can you provide Lottie animation references for avatar states?
5. What's your preferred timeline for deliverables?

---

## Reference Links

- **Grok AI App:** Download from App Store (X/Twitter app → Grok)
- **iOS Design Guidelines:** https://developer.apple.com/design/human-interface-guidelines/
- **Glass Morphism:** https://hype4.academy/tools/glassmorphism-generator
- **Lottie Animations:** https://lottiefiles.com/

---

**Let's create something beautiful! 🎨**

Contact: [Your contact info]
