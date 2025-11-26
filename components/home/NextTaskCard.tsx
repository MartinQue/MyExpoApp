import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface NextTaskCardProps {
  task: {
    title: string;
    time: string;
    type: string;
  };
  onPress?: () => void;
}

export function NextTaskCard({ task, onPress }: NextTaskCardProps) {
  const { isDark } = useTheme();

  // Creative 2-tone gradient - warm sunset theme
  const gradientColors: readonly [string, string, ...string[]] = isDark
    ? (['#FF6B00', '#FF0080'] as const) // Orange to Hot Pink (dark mode)
    : (['#FF8534', '#FF1493'] as const); // Brighter orange to Deep Pink (light mode)

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={[
        styles.container,
        { shadowColor: isDark ? '#FF0080' : '#FF1493' },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.label}>What&apos;s up next</Text>
            <Text style={styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={styles.time}>{task.time}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    borderRadius: 24,
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 28, // Better line height for wrapped text
  },
  time: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
});
