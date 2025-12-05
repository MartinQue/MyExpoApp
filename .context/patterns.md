# Code Patterns - MyExpoApp

Common code patterns that MUST be followed when building features in this monorepo.

---

## 🎨 UI Pattern: Glassmorphism Components

### Pattern Description
All UI components use a **glassmorphism design** with blur effects, semi-transparent backgrounds, and subtle borders.

### Core Pattern
```typescript
import { BlurView } from 'expo-blur';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const GlassComponent = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();

  return (
    <BlurView
      intensity={80}              // ✅ Always 60-80 range
      tint={theme}                // ✅ Theme-aware (light/dark)
      style={styles.glass}
    >
      <View style={styles.inner}>
        {children}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glass: {
    borderRadius: 16,            // ✅ Always 12-20px
    overflow: 'hidden',          // ✅ Required for blur
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // ✅ Subtle white border
  },
  inner: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // ✅ Semi-transparent
  },
});
```

### Variations

**GlassCard** (Content container):
```typescript
<BlurView intensity={80} tint={theme} style={styles.card}>
  <View style={styles.cardInner}>
    <Text>Card content</Text>
  </View>
</BlurView>
```

**GlassButton** (Interactive element):
```typescript
<Pressable onPress={handlePress}>
  <BlurView intensity={60} tint={theme} style={styles.button}>
    <Text style={styles.buttonText}>Press Me</Text>
  </BlurView>
</Pressable>
```

**GlassHeader** (Screen header):
```typescript
<BlurView intensity={80} tint={theme} style={styles.header}>
  <SafeAreaView>
    <Text style={styles.title}>Screen Title</Text>
  </SafeAreaView>
</BlurView>
```

### Rules
- ✅ Blur intensity: 60-80
- ✅ Border radius: 12-20px
- ✅ Border: 1px white at 10% opacity
- ✅ Background: white 5-10% opacity
- ✅ Always use theme tint
- ✅ Always include `overflow: 'hidden'`

---

## 🎭 Theme Pattern

### Pattern Description
All components support light and dark themes using the Theme Context.

### Core Pattern
```typescript
import { useTheme } from '@/contexts/ThemeContext';

export const ThemedComponent = () => {
  const { theme, colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>
        Themed Content
      </Text>
      <Text style={{ color: colors.textSecondary }}>
        Secondary text
      </Text>
    </View>
  );
};
```

### Available Colors
```typescript
const { colors } = useTheme();

colors.background       // Main background
colors.surface          // Card/component backgrounds
colors.primary          // Primary brand color
colors.secondary        // Secondary brand color
colors.text             // Primary text
colors.textSecondary    // Secondary text
colors.border           // Border colors
colors.error            // Error states
colors.success          // Success states
colors.warning          // Warning states
```

### Rules
- ✅ Always use `useTheme()` for colors
- ❌ Never hardcode colors
- ✅ Test in both light and dark modes
- ✅ Use semantic color names

---

## 📳 Haptic Feedback Pattern

### Pattern Description
All interactive elements provide haptic feedback for better UX.

### Core Pattern
```typescript
import { useHaptics } from '@/hooks/useHaptics';

export const InteractiveComponent = ({ onPress }: Props) => {
  const { triggerHaptic } = useHaptics();

  const handlePress = () => {
    triggerHaptic('impact', 'light'); // ✅ Haptic first
    onPress();                         // Then action
  };

  return (
    <Pressable onPress={handlePress}>
      <Text>Tap Me</Text>
    </Pressable>
  );
};
```

### Haptic Types

**Tap/Selection** (most common):
```typescript
triggerHaptic('impact', 'light');
```

**Confirmation**:
```typescript
triggerHaptic('impact', 'medium');
```

**Important Action**:
```typescript
triggerHaptic('impact', 'heavy');
```

**Success**:
```typescript
triggerHaptic('notification', 'success');
```

**Warning**:
```typescript
triggerHaptic('notification', 'warning');
```

**Error**:
```typescript
triggerHaptic('notification', 'error');
```

### Rules
- ✅ Add haptics to all buttons
- ✅ Add haptics to all pressable elements
- ✅ Call haptic BEFORE the action
- ✅ Use `light` for taps, `medium` for confirmations
- ✅ Use notification types for feedback states

---

## 📦 State Management: Zustand Store Pattern

### Pattern Description
Feature state is managed with Zustand stores following a consistent pattern.

### Core Pattern
```typescript
import { create } from 'zustand';

// 1. Define the state interface
interface FeatureState {
  // Data
  items: Item[];
  selectedItem: Item | null;

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  selectItem: (item: Item) => void;
  updateItem: (id: string, data: Partial<Item>) => void;
  deleteItem: (id: string) => Promise<void>;

  // Utility
  reset: () => void;
}

// 2. Create the store
export const useFeatureStore = create<FeatureState>((set, get) => ({
  // Initial state
  items: [],
  selectedItem: null,
  isLoading: false,
  error: null,

  // Async action with error handling
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await FeatureService.getItems();
      set({ items, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  },

  // Sync action
  selectItem: (item) => set({ selectedItem: item }),

  // Update with optimistic UI
  updateItem: (id, data) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }));
  },

  // Delete with service call
  deleteItem: async (id) => {
    set({ isLoading: true });
    try {
      await FeatureService.deleteItem(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Reset to initial state
  reset: () =>
    set({
      items: [],
      selectedItem: null,
      isLoading: false,
      error: null,
    }),
}));
```

### Usage in Components
```typescript
import { useFeatureStore } from '@/stores/featureStore';

export const FeatureComponent = () => {
  // Select only what you need
  const items = useFeatureStore((state) => state.items);
  const isLoading = useFeatureStore((state) => state.isLoading);
  const fetchItems = useFeatureStore((state) => state.fetchItems);

  useEffect(() => {
    fetchItems();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return <ItemList items={items} />;
};
```

### Rules
- ✅ One store per feature domain
- ✅ Include `isLoading` and `error` for async operations
- ✅ Always include `reset()` method
- ✅ Keep stores flat (avoid deep nesting)
- ✅ Business logic goes in services, not stores
- ✅ Use selectors in components for performance

---

## 🔌 Service Layer Pattern

### Pattern Description
All API calls and business logic go through service classes.

### Core Pattern
```typescript
// lib/services/FeatureService.ts
import { supabase } from '@/lib/supabase';

export class FeatureService {
  /**
   * Fetch all items for a user
   */
  static async getItems(userId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new item
   */
  static async createItem(input: CreateItemInput): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .insert({
        ...input,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create item: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing item
   */
  static async updateItem(
    id: string,
    updates: Partial<Item>
  ): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update item: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an item
   */
  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }
}
```

### AI Service Pattern
```typescript
import { openai } from '@/lib/openai';

export class AIService {
  static async generateText(prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  }

  static async generateImage(prompt: string): Promise<string> {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data[0].url;
  }
}
```

### Rules
- ✅ Static methods or class instances
- ✅ Clear method names (get, create, update, delete)
- ✅ Throw errors with descriptive messages
- ✅ Return typed data (use TypeScript)
- ✅ Handle all error cases
- ✅ Add JSDoc comments for complex methods

---

## 🤖 Agent Integration Pattern

### Pattern Description
Interaction with the multi-agent LangGraph backend.

### Core Pattern
```typescript
import { langgraphClient } from '@/lib/agents/AgentManager';

export const useAgentChat = () => {
  const [response, setResponse] = useState<string>('');
  const [activeAgent, setActiveAgent] = useState<string>('supervisor');
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async (message: string, userId: string) => {
    setIsThinking(true);

    try {
      // Invoke LangGraph with thread context
      const result = await langgraphClient.invoke({
        input: message,
        config: {
          configurable: {
            thread_id: userId,
          },
        },
      });

      // Extract agent and response
      setActiveAgent(result.agent_used || 'general');
      setResponse(result.response);

      return result;
    } catch (error) {
      console.error('Agent error:', error);
      throw error;
    } finally {
      setIsThinking(false);
    }
  };

  return {
    sendMessage,
    response,
    activeAgent,
    isThinking,
  };
};
```

### Rules
- ✅ Always include `thread_id` for conversation context
- ✅ Track which agent responded
- ✅ Show thinking state during processing
- ✅ Handle errors gracefully
- ✅ Return structured data

---

## 📱 Component Structure Pattern

### Full Component Template
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useFeatureStore } from '@/stores/featureStore';

// 1. Props interface
interface FeatureComponentProps {
  title: string;
  data?: DataType[];
  onAction?: (item: DataType) => void;
  style?: ViewStyle;
}

// 2. Component definition
export const FeatureComponent = ({
  title,
  data = [],
  onAction,
  style,
}: FeatureComponentProps) => {
  // 3. Hooks (in order)
  const { theme, colors } = useTheme();
  const { triggerHaptic } = useHaptics();
  const fetchData = useFeatureStore((state) => state.fetchData);
  const isLoading = useFeatureStore((state) => state.isLoading);

  // 4. Local state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 5. Effects
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 6. Callbacks
  const handlePress = useCallback(
    (item: DataType) => {
      triggerHaptic('impact', 'light');
      setSelectedId(item.id);
      onAction?.(item);
    },
    [onAction, triggerHaptic]
  );

  // 7. Early returns (loading, error, empty)
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 8. Render
  return (
    <BlurView intensity={80} tint={theme} style={[styles.container, style]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>
        {data.map((item) => (
          <Pressable key={item.id} onPress={() => handlePress(item)}>
            <Text style={{ color: colors.text }}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
    </BlurView>
  );
};

// 9. Styles
const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inner: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});
```

### Component Organization Order
1. Imports (React, React Native, libs, local)
2. TypeScript interfaces
3. Component definition
4. Hooks (theme, haptics, stores)
5. Local state
6. Effects
7. Callbacks
8. Early returns (loading, error)
9. Main render
10. Styles

---

## 🚀 Performance Patterns

### Memoization
```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
export const ExpensiveComponent = memo(({ data }: Props) => {
  // Component logic
});

// Memoize expensive computations
const sortedData = useMemo(
  () => data.sort((a, b) => a.timestamp - b.timestamp),
  [data]
);

// Memoize callbacks
const handlePress = useCallback(() => {
  // Handle press
}, [dependency]);
```

### List Optimization
```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

---

## 📐 Import Pattern

```typescript
// 1. React & React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import { BlurView } from 'expo-blur';
import { create } from 'zustand';

// 3. Workspace packages
import config from '@myexpoapp/shared-config';

// 4. Local imports (using @ alias)
import { useTheme } from '@/contexts/ThemeContext';
import { useFeatureStore } from '@/stores/featureStore';
import { FeatureService } from '@/lib/services/FeatureService';
import { GlassButton } from '@/components/Glass/GlassButton';
import type { Feature } from '@/types/feature';
```

---

**Version**: 1.0.0
**Last Updated**: December 3, 2025
