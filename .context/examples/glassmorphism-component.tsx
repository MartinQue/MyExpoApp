/**
 * Example: Glassmorphism Component Template
 *
 * This is a reference implementation showing the standard pattern
 * for creating glassmorphism UI components in the MyExpoApp monorepo.
 *
 * Key Features:
 * - BlurView for glass effect
 * - Theme-aware styling
 * - Haptic feedback
 * - TypeScript types
 * - Proper import structure
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useHaptics } from '@/hooks/useHaptics';

// 1. Define Props Interface
interface GlassCardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
  intensity?: number; // Optional: override blur intensity
}

// 2. Component Definition
export const GlassCard = ({
  title,
  subtitle,
  onPress,
  children,
  style,
  intensity = 80,
}: GlassCardProps) => {
  // 3. Hooks
  const { theme, colors } = useTheme();
  const { triggerHaptic } = useHaptics();

  // 4. Handlers
  const handlePress = () => {
    if (onPress) {
      triggerHaptic('impact', 'light');
      onPress();
    }
  };

  // 5. Conditional Wrapper
  const content = (
    <BlurView intensity={intensity} tint={theme} style={[styles.glass, style]}>
      <View style={styles.inner}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        {/* Subtitle (optional) */}
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}

        {/* Children */}
        {children}
      </View>
    </BlurView>
  );

  // 6. Return with optional Pressable wrapper
  if (onPress) {
    return (
      <Pressable onPress={handlePress} style={styles.pressable}>
        {content}
      </Pressable>
    );
  }

  return content;
};

// 7. Styles
const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  glass: {
    // Glass container
    borderRadius: 16, // ✅ Always 12-20px
    overflow: 'hidden', // ✅ Required for blur effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)', // ✅ Subtle white border

    // Shadow (optional, for depth)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inner: {
    // Inner container
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // ✅ Semi-transparent
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
});

// 8. Example Usage (for documentation)
/*
import { GlassCard } from '@/components/Glass/GlassCard';

<GlassCard
  title="Welcome"
  subtitle="Start your journey"
  onPress={() => console.log('Pressed!')}
>
  <Text>Card content here</Text>
</GlassCard>
*/
