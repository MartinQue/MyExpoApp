import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/stores/chatStore';

interface ChatContainerProps {
  messages: Message[];
}

export function ChatContainer({ messages }: ChatContainerProps) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            role={item.role === 'user' ? 'user' : 'assistant'}
            content={item.content}
          />
        )}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 140, // Increased to prevent composer overlap
  },
});
