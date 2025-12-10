# Grok UI Implementation Plan

## Analysis of Reference Images

### 1. Companion Selection Screen (Grid Layout)

- **Layout**: 2-column grid (not horizontal scroll)
- **Cards**: Vertical cards with:
  - Large preview image
  - 18+ badge (glassmorphic, top-left) for adult avatars
  - Name (large, white, bold)
  - Description (smaller, lighter white)
  - Two buttons at bottom:
    - Chat button: Circular, dark gray, glassmorphic
    - Voice button: Pill-shaped, white when active
  - Active state: White border + glow around entire card
  - Loading state: White progress bar on voice button

### 2. Avatar Loading Screen

- Circular frame with avatar preview inside
- "X% downloaded" text below
- Spinning loader
- Dark blurred background

### 3. Full Avatar View (After Loading)

- Large 3D avatar in center
- Glassmorphic input bar at bottom ("Ask Anything")
- Right sidebar with action buttons (flame, target, hanger, trash, chevron)
- Top navigation tabs show avatar name
- Dark gradient background

### 4. Chat View

- Glassmorphic chat bubbles
- Input bar with "Chat with [Name]"
- "Call" button on right
- Video Calls indicator

## Implementation Steps

1. **Fix Avatar Names**: Use AVATAR_PRESETS (Mika, Ani, Valentine, Good Rudi, Nova)
2. **Create Mapping**: Map AVATAR_PRESETS to VRM models
3. **Grid Layout**: Change from horizontal scroll to 2-column grid
4. **Redesign Cards**: Match Grok UI exactly
5. **Loading Screen**: Circular frame with progress
6. **Full Avatar View**: New screen with glassmorphic elements
7. **Progress Indicators**: Show loading on cards

## Mapping Strategy

AVATAR_PRESETS → VRM Models:

- Mika (calm personality) → Calm.vrm
- Ani (energetic) → Airi.vrm
- Valentine (sophisticated) → Mind.vrm
- Good Rudi (warm, kid-friendly) → Heart.vrm
- Nova (motivational) → Rise.vrm



