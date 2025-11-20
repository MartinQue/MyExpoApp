import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Theme';
import * as Haptics from 'expo-haptics';

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
          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons name="copy-outline" size={16} color={Colors.gray[400]} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons name="share-outline" size={16} color={Colors.gray[400]} />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons
              name="thumbs-up-outline"
              size={16}
              color={Colors.gray[400]}
            />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons
              name="thumbs-down-outline"
              size={16}
              color={Colors.gray[400]}
            />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color={Colors.gray[400]}
            />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={16}
              color={Colors.gray[400]}
            />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 16,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#212327', // Grok User Bubble
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'transparent', // Minimalist assistant
    paddingLeft: 0,
  },
  text: {
    color: 'white',
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});
