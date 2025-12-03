import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { MessageBubble } from './MessageBubble';
import { Message } from '../../stores/chatStore';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChatContainerProps {
  messages: Message[];
  bottomPadding?: number;
}

export function ChatContainer({ messages, bottomPadding = 20 }: ChatContainerProps) {
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    // Animate new messages
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          style={styles.list}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          automaticallyAdjustContentInsets={false}
        />
      </View>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20, // Space is handled by KeyboardAvoidingView + sibling layout
    gap: 16,
  },
});
