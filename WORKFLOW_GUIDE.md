# AI-Assisted Development Workflow Guide

How to build features 10x faster using BMAD + Context Engineering + Cursor + KiloCode.

**Last Updated:** December 3, 2025
**Version:** 1.0.0

---

## 🎯 The 10x Development Stack

```
BMAD Rules          → What to build + How to structure
Context Engineering → How AI understands the codebase
Cursor AI           → Primary development environment
KiloCode (optional) → Automated scaffolding
Claude Code         → Advanced code generation
```

---

## 📚 Required Reading

Before starting, ensure you've read:

1. ✅ `BMAD_RULES.md` - Architecture rules
2. ✅ `.cursorrules` - Cursor AI rules
3. ✅ `.context/README.md` - Context engineering intro
4. ✅ `.context/patterns.md` - Code patterns
5. ✅ `.context/structure.md` - Codebase structure

---

## 🚀 Development Workflow

### Phase 1: Planning (5-10 minutes)

**Step 1: Define the Feature**
```markdown
Feature: Add meditation timer to Mindfulness tab

Requirements:
- Glassmorphism UI matching app design
- Timer with durations: 5, 10, 15, 20 minutes
- Background audio support
- Haptic feedback on start/pause/complete
- Save sessions to Supabase
- Progress tracking in planner
```

**Step 2: Break Down into Tasks**
Use TodoWrite or manual list:
1. Create MeditationTimer component
2. Create meditationStore (Zustand)
3. Create MeditationService for API
4. Add audio playback logic
5. Integrate with Mindfulness tab
6. Add progress tracking

**Step 3: Review Context Files**
- Check `.context/patterns.md` for similar patterns
- Check `.context/examples/` for templates
- Check `apps/happiness-app/` for existing code

---

### Phase 2: AI-Assisted Implementation

#### Using Cursor AI

**1. Component Generation**

```
Prompt to Cursor:
"Create a MeditationTimer component following the glassmorphism pattern.
Include:
- BlurView with intensity 80
- Duration selector (5, 10, 15, 20 min)
- Start/pause/stop buttons with haptics
- Circular progress indicator
- Theme support
Use the glassmorphism-component.tsx template from .context/examples/"
```

**Expected Output:** Complete component matching your patterns.

**2. Store Creation**

```
Prompt to Cursor:
"Create meditationStore using Zustand following the store pattern.
Include:
- Session data (duration, startTime, completed)
- Timer state (isRunning, remaining Time)
- Actions: startSession, pauseSession, completeSession
- Save to MeditationService
Use the zustand-store.ts template from .context/examples/"
```

**Expected Output:** Store with proper TypeScript types and service integration.

**3. Service Layer**

```
Prompt to Cursor:
"Create MeditationService following the service layer pattern.
Methods:
- saveMeditationSession(userId, duration, completedAt)
- getMeditationHistory(userId)
- getMeditationStats(userId) - total sessions, total minutes
Use Supabase and follow service-layer.ts template from .context/examples/"
```

**Expected Output:** Service class with error handling and typed responses.

---

#### Using Claude Code

**1. Feature Implementation**

```
Prompt:
"I need to add a meditation timer to the Mindfulness tab in happiness-app.
Follow BMAD_RULES.md strictly. Use glassmorphism UI, add haptics, support themes.
Create all necessary components, stores, and services.
Read .context/patterns.md for examples."
```

Claude Code will:
1. Read BMAD_RULES.md
2. Check .context/patterns.md
3. Review existing happiness-app structure
4. Generate complete feature implementation
5. Follow all established patterns

**2. Integration Tasks**

```
Prompt:
"Integrate the MeditationTimer into the Mindfulness tab.
- Add to components/tabs/MindfulnessTab.tsx
- Use existing glassmorphism layout
- Match the tab's gradient (purple)
- Add navigation if needed"
```

---

#### Using KiloCode (Optional)

**For Scaffolding:**

```bash
# Generate component boilerplate
kilocode generate component MeditationTimer --glass --haptics --theme

# Generate store
kilocode generate store meditation

# Generate service
kilocode generate service Meditation --supabase
```

---

### Phase 3: Review & Refinement

**Step 1: Check Against BMAD Rules**

Run through checklist:
- [ ] Glassmorphism UI applied?
- [ ] Haptic feedback on interactions?
- [ ] Theme support (light/dark)?
- [ ] TypeScript types defined?
- [ ] Service layer for API calls?
- [ ] Zustand store for state?
- [ ] Imports use @ alias?
- [ ] No console.log statements?
- [ ] No hardcoded colors?
- [ ] Error handling present?

**Step 2: Test the Feature**

```bash
# Type check
cd apps/happiness-app
npx tsc --noEmit

# Run the app
npm start

# Test on multiple platforms
# - iOS
# - Android
# - Web (if applicable)
```

**Step 3: Refinement Prompts**

If something needs adjustment:

```
Cursor/Claude Prompt:
"The MeditationTimer needs these changes:
1. Increase blur intensity to 80
2. Add subtle scale animation on press
3. Show completion celebration with confetti
Follow the animation patterns in the codebase."
```

---

## 🔥 Advanced Workflows

### Multi-Feature Development

**Parallel Feature Building:**

1. Open multiple Cursor windows
2. Assign each to a feature
3. Prompt each with specific context
4. Merge incrementally

**Example:**
- Window 1: Meditation Timer
- Window 2: Breathing Exercise
- Window 3: Guided Meditations List

### Cross-App Feature Sharing

**When building a feature for multiple apps:**

1. Build in happiness-app first (reference implementation)
2. Extract to shared package if truly reusable
3. Import in other apps

```bash
# Create shared package
mkdir packages/meditation-timer

# Move component
mv apps/happiness-app/components/meditation/MeditationTimer.tsx \
   packages/meditation-timer/src/MeditationTimer.tsx

# Update imports
import { MeditationTimer } from '@myexpoapp/meditation-timer';
```

---

## 💡 Pro Tips

### 1. Reference Existing Code

```
Cursor Prompt:
"Create a new screen similar to apps/happiness-app/app/(tabs)/chat.tsx
but for video calls. Follow the same patterns, layout, and structure."
```

AI will analyze the reference file and replicate patterns.

### 2. Incremental Building

Don't ask for entire features at once. Build incrementally:

1. Component structure
2. Add state management
3. Connect to services
4. Add animations
5. Polish UI

### 3. Context Reminder Prompts

If AI seems to forget patterns:

```
"Remember to follow BMAD_RULES.md:
- Use glassmorphism for all UI
- Add haptic feedback
- Support light/dark themes
- Use Zustand for state
Check .context/patterns.md for examples."
```

### 4. Template Reuse

```
"Use the template from .context/examples/glassmorphism-component.tsx
but customize for a meditation timer with these changes: [...]"
```

### 5. Batch Similar Tasks

```
"Create 5 components following the same glassmorphism pattern:
1. MeditationTimer
2. BreathingExercise
3. GuidedMeditationPlayer
4. ProgressChart
5. AchievementBadge

Use the glassmorphism template for all."
```

---

## 🎨 Design System Integration

### Using Design Tokens

When creating UI, reference design system:

```
Cursor Prompt:
"Create a meditation timer card using:
- Gradient: constants/DesignSystem.ts TabGradients.mindfulness
- Spacing: GrokLayout.spacing
- Typography: GrokTypography.heading2
- Border radius: DesignSystem.borderRadius.large"
```

### Theme-Aware Components

```
"Create component with theme support.
Use ThemeContext for colors.
Test in both light and dark modes.
Reference apps/happiness-app/contexts/ThemeContext.tsx"
```

---

## 🤖 Agent-Specific Workflows

### Building Agent Features

When building features that use the multi-agent system:

```
Cursor Prompt:
"Add mindfulness meditation suggestions to the Mindfulness agent.
1. Update agent prompt in langgraph/
2. Add meditation recommendation logic
3. Display suggestions in UI
4. Track which agent provided suggestions

Reference .context/agents.md for agent patterns."
```

### Testing Agent Responses

```typescript
// Test agent routing
const testAgentRouting = async () => {
  const tests = [
    { input: 'Help me meditate', expected: 'mindfulness' },
    { input: 'Budget advice', expected: 'finance' },
    { input: 'Career change', expected: 'career' },
  ];

  for (const test of tests) {
    const result = await invokeAgent(test.input, userId);
    console.log(`Input: "${test.input}"`);
    console.log(`Expected: ${test.expected}, Got: ${result.agent}`);
  }
};
```

---

## 🚦 Quality Gates

Before considering a feature complete:

### Code Quality
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] No console.log statements
- [ ] No unused imports/variables

### Architecture
- [ ] Follows BMAD_RULES.md
- [ ] Uses glassmorphism pattern
- [ ] Includes haptic feedback
- [ ] Supports light/dark themes
- [ ] State in Zustand store
- [ ] API calls in service layer
- [ ] Proper file location

### Testing
- [ ] Works on iOS
- [ ] Works on Android
- [ ] Works on Web (if applicable)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Edge cases covered

### Documentation
- [ ] Component has JSDoc comments
- [ ] Complex logic explained
- [ ] README updated (if needed)

---

## 📊 Measuring Success

Track your velocity improvement:

### Before Context Engineering
- Feature: Meditation Timer
- Time: 2-3 days
- Iterations: 5-6 (fixing patterns, styling, state)

### After Context Engineering
- Feature: Meditation Timer
- Time: 3-4 hours
- Iterations: 1-2 (minor tweaks only)

**10x Faster = True! 🚀**

---

## 🔄 Iterative Improvement

### Learning from Generated Code

When AI generates good code:
1. Add pattern to `.context/patterns.md`
2. Save example to `.context/examples/`
3. Update BMAD_RULES.md if needed

### Learning from Mistakes

When AI generates incorrect code:
1. Identify what pattern was missed
2. Add explicit rule to `.cursorrules`
3. Update context files with counter-example

---

## 🎯 Common Workflows

### Workflow 1: New Screen

```
1. Plan: Define screen layout and features
2. Generate: "Create [ScreenName] screen with [features]"
3. Review: Check glassmorphism, haptics, theme
4. Integrate: Add to navigation
5. Test: Run on all platforms
```

### Workflow 2: New Component

```
1. Template: Choose from .context/examples/
2. Customize: Modify for specific use case
3. Style: Apply glassmorphism pattern
4. Enhance: Add haptics and theme support
5. Document: Add JSDoc comments
```

### Workflow 3: New Feature

```
1. Break Down: Split into components + store + service
2. Generate: Use Cursor/Claude for each piece
3. Integrate: Connect pieces together
4. Polish: Animations, transitions, UX
5. Ship: Commit and deploy
```

### Workflow 4: Bug Fix

```
1. Identify: Locate the bug in codebase
2. Prompt: "Fix [bug] in [file] while maintaining [pattern]"
3. Verify: Test the fix
4. Regression: Ensure nothing else broke
5. Document: Add comment explaining fix
```

### Workflow 5: Refactoring

```
1. Analyze: Identify code that needs refactoring
2. Plan: Define target structure
3. Prompt: "Refactor [file] to use [pattern] from BMAD_RULES"
4. Test: Ensure functionality unchanged
5. Clean: Remove old code
```

---

## 🚀 Next-Level Techniques

### 1. Multi-Step Generation

```
Cursor Prompt:
"I'll describe a feature in 3 steps. Generate each step one at a time:

Step 1: Create MeditationTimer component with basic UI
Step 2: Add timer logic and state management
Step 3: Connect to backend and add persistence

Start with Step 1."
```

### 2. Guided Refinement

```
"The meditation timer is working but needs improvements:
1. Add a breathing animation during meditation
2. Play calming sounds
3. Show progress with a circular chart
4. Add achievement badges

Implement these one by one, starting with #1."
```

### 3. Pattern Extraction

```
"I see similar patterns in ChatInputBar, VoiceInputButton, and MessageBubble.
Extract the common glassmorphism pattern into a reusable GlassContainer component.
Then refactor those three components to use it."
```

### 4. Cross-Reference Learning

```
"Study how voice input works in ChatInputBar.tsx
and apply the same pattern to create voice notes in the meditation timer."
```

---

## 📝 Documentation Integration

### Updating Documentation

After building significant features:

```
Cursor Prompt:
"Document the meditation timer feature:
1. Add to .context/patterns.md as a new pattern
2. Create example in .context/examples/meditation-timer.tsx
3. Update BMAD_RULES.md if new architectural decisions were made"
```

---

## ✅ Final Checklist

Before marking a feature as complete:

### Code
- [ ] Follows all BMAD rules
- [ ] Passes TypeScript check
- [ ] Passes ESLint
- [ ] No console.logs
- [ ] Clean imports

### UI/UX
- [ ] Glassmorphism applied
- [ ] Haptics implemented
- [ ] Theme support
- [ ] Animations smooth
- [ ] Responsive design

### Architecture
- [ ] Zustand for state
- [ ] Services for API
- [ ] Proper file structure
- [ ] @ alias imports
- [ ] Type safety

### Testing
- [ ] iOS tested
- [ ] Android tested
- [ ] Web tested (if applicable)
- [ ] Loading states
- [ ] Error states

### Documentation
- [ ] JSDoc comments
- [ ] README updated
- [ ] Context files updated

---

## 🎓 Learning Resources

- **BMAD Method**: https://github.com/bmad-code-org/BMAD-METHOD
- **Context Engineering**: https://github.com/coleam00/context-engineering-intro
- **Cursor Docs**: https://cursor.sh/docs
- **Expo Docs**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/

---

## 🙌 You're Ready!

You now have:
- ✅ Architecture rules (BMAD_RULES.md)
- ✅ AI integration (.cursorrules)
- ✅ Context files (.context/)
- ✅ Working examples (.context/examples/)
- ✅ This workflow guide

**Start building 10x faster! 🚀**

---

**Version**: 1.0.0
**Last Updated**: December 3, 2025
