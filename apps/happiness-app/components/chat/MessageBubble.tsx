import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as GrokColors } from '../../constants/GrokColors';
import { GrokLayout } from '../../constants/GrokLayout';
import { GrokTypography } from '../../constants/GrokTypography';
import haptics from '@/lib/haptics';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text style={styles.text}>{content}</Text>
      </View>

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
    padding: GrokLayout.messageBubble.padding,
    borderRadius: GrokLayout.messageBubble.borderRadius,
  },
  userBubble: {
    backgroundColor: GrokColors.userBubble,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: GrokColors.assistantBubble,
    borderBottomLeftRadius: 4,
    // Remove border/background if transparent desired,
    // but Grok uses card color
  },
  text: {
    color: GrokColors.primary,
    fontSize: GrokTypography.fontSizes.base,
    // FIX: React Native lineHeight is pixels, not a multiplier.
    // Multiplier 1.5 -> 1.5px height -> Glitch.
    // Calculation: 16 * 1.5 = 24px
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
