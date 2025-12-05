import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors as GrokColors } from '../../constants/GrokColors';
import { GrokLayout } from '../../constants/GrokLayout';
import { GrokTypography } from '../../constants/GrokTypography';
import { useTheme } from '@/contexts/ThemeContext';
import haptics from '@/lib/haptics';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <BlurView
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <View
          style={[
            styles.bubbleInner,
            {
              backgroundColor: isUser
                ? 'rgba(139, 92, 246, 0.2)' // Purple tint for user
                : 'rgba(255, 255, 255, 0.05)', // Subtle white for assistant
            },
          ]}
        >
          <Text style={styles.text}>{content}</Text>
        </View>
      </BlurView>

      {!isUser && (
        <View style={styles.actions}>
          {[
            { icon: 'copy-outline', label: 'Copy' },
            { icon: 'share-outline', label: 'Share' },
            { icon: 'thumbs-up-outline', label: 'Good' },
            { icon: 'thumbs-down-outline', label: 'Bad' },
            { icon: 'refresh-outline', label: 'Regenerate' },
          ].map(({ icon, label }) => (
            <Pressable
              key={label}
              style={styles.actionButton}
              onPress={() => haptics.selection()}
            >
              <Ionicons name={icon as any} size={17} color={GrokColors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: GrokLayout.messageBubble.maxWidth,
    marginBottom: GrokLayout.spacing.md,
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: GrokLayout.messageBubble.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  bubbleInner: {
    padding: GrokLayout.messageBubble.padding,
  },
  text: {
    color: GrokColors.primary,
    fontSize: GrokTypography.fontSizes.base,
    lineHeight:
      GrokTypography.fontSizes.base * GrokTypography.lineHeights.normal,
  },
  actions: {
    flexDirection: 'row',
    marginTop: GrokLayout.spacing.sm,
    gap: GrokLayout.spacing.lg,
    paddingLeft: GrokLayout.spacing.sm,
    paddingRight: GrokLayout.spacing.sm,
    opacity: 0.85,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
});
