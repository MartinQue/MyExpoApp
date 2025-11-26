import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Text,
  Keyboard,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import * as haptics from '@/lib/haptics';
import { ChatInputBar } from '../chat/ChatInputBar';
import {
  ChatMessage,
  sendMessageToAI,
  getAgentColor,
} from '../chat/ChatHelpers';
import { AgentType } from '@/lib/langsmith';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import { usePlannerStore } from '@/stores/plannerStore';
import { useUserStore } from '@/stores/userStore';

// Context-aware suggestions based on time
const getTimeSuggestions = (): {
  icon: string;
  text: string;
  prompt: string;
}[] => {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Morning suggestions (5-12)
  if (hour >= 5 && hour < 12) {
    return [
      {
        icon: 'sunny',
        text: 'Morning routine',
        prompt: 'Help me plan my morning routine to be more productive',
      },
      {
        icon: 'calendar',
        text: "Today's priorities",
        prompt: 'What should I focus on today? Help me prioritize my tasks',
      },
      {
        icon: 'fitness',
        text: 'Workout ideas',
        prompt: 'Give me a quick morning workout routine',
      },
      {
        icon: 'nutrition',
        text: 'Healthy breakfast',
        prompt: 'Suggest a healthy breakfast that will give me energy',
      },
    ];
  }

  // Afternoon suggestions (12-17)
  if (hour >= 12 && hour < 17) {
    return [
      {
        icon: 'battery-half',
        text: 'Energy boost',
        prompt: "I'm feeling tired this afternoon. How can I boost my energy?",
      },
      {
        icon: 'checkmark-done',
        text: 'Task review',
        prompt: "Let's review what I've accomplished today so far",
      },
      {
        icon: 'bulb',
        text: 'Creative block',
        prompt: "Help me brainstorm ideas - I'm stuck on something",
      },
      {
        icon: 'people',
        text: 'Meeting prep',
        prompt: 'Help me prepare for an important meeting',
      },
    ];
  }

  // Evening suggestions (17-21)
  if (hour >= 17 && hour < 21) {
    return [
      {
        icon: 'moon',
        text: 'Wind down',
        prompt: 'Help me transition from work mode to relaxation',
      },
      {
        icon: 'book',
        text: 'Daily reflection',
        prompt: 'Guide me through reflecting on my day',
      },
      {
        icon: 'heart',
        text: 'Gratitude',
        prompt: 'Help me practice gratitude - what went well today?',
      },
      {
        icon: 'calendar-outline',
        text: 'Plan tomorrow',
        prompt: 'Help me plan tomorrow so I can relax tonight',
      },
    ];
  }

  // Night suggestions (21-5)
  return [
    {
      icon: 'bed',
      text: 'Sleep prep',
      prompt: 'Help me wind down for better sleep',
    },
    {
      icon: 'journal',
      text: 'Journal prompt',
      prompt: 'Give me a journaling prompt to process my thoughts',
    },
    {
      icon: 'sparkles',
      text: 'Dream goals',
      prompt: "Let's talk about my dreams and aspirations",
    },
    {
      icon: 'cloud',
      text: 'Clear my mind',
      prompt: 'My mind is racing. Help me find calm',
    },
  ];
};

// Get contextual greeting based on time
const getContextualGreeting = (userName: string): string => {
  const hour = new Date().getHours();
  const name = userName || 'friend';

  if (hour >= 5 && hour < 12) {
    return `Good morning, ${name}! ☀️ Fresh day, fresh start. What's brewing in your mind?`;
  }
  if (hour >= 12 && hour < 17) {
    return `Hey ${name}! 🌤️ Afternoon check-in - how's your day flowing?`;
  }
  if (hour >= 17 && hour < 21) {
    return `Evening, ${name}! 🌅 Time to unwind. What do you want to talk through?`;
  }
  return `Hey ${name} 🌙 Still up? I'm here if you need to chat or process anything.`;
};

// Create initial messages with context
const createInitialMessages = (userName: string): ChatMessage[] => [
  {
    _id: 'greeting-1',
    text: getContextualGreeting(userName),
    createdAt: new Date(),
    user: { _id: 2, name: 'Alter Ego' },
  },
];

export function AskScreen() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { isListening, isTranscribing, startRecording, stopRecording } =
    useVoiceContext();
  const { user } = useUserStore();
  const { plans } = usePlannerStore();

  // Initialize messages with contextual greeting
  const initialMessages = useMemo(
    () => createInitialMessages(user?.name || ''),
    [user?.name]
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Get time-based suggestions
  const suggestions = useMemo(() => getTimeSuggestions(), []);

  // Get active plan for context chips
  const activePlan = plans.find((p) => p.progress < 100);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Hide suggestions after first message
    setShowSuggestions(false);

    // Haptic feedback on send
    haptics.send();

    // Add user message
    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };

    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();
    setIsTyping(true);

    try {
      // Get REAL AI response
      const response = await sendMessageToAI(text);

      // Haptic feedback on response
      haptics.success();

      setMessages((prev) => [...prev, response]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          _id: `error_${Date.now()}`,
          text: "Something went wrong. Let's try that again.",
          createdAt: new Date(),
          user: { _id: 2, name: 'Alter Ego' },
          error: true,
        },
      ]);

      haptics.error();
    } finally {
      setIsTyping(false);
    }
  };

  // Handle suggestion tap
  const handleSuggestionTap = (prompt: string) => {
    haptics.button();
    handleSend(prompt);
  };

  const handleVoiceToggle = async (recording: boolean) => {
    if (recording) {
      // Start recording using shared context
      await startRecording();
    } else {
      // Stop recording and get transcription from shared context
      const text = await stopRecording();
      if (text && text.trim()) {
        handleSend(text);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const isUser = item.user._id === 1;
    const isError = (item as any).error;
    const agent = (item as any).agent as AgentType | undefined;
    const showTimestamp =
      index === messages.length - 1 ||
      messages[index + 1]?.user._id !== item.user._id;

    // Get agent color for non-alter_ego agents
    const agentColor =
      agent && agent !== 'alter_ego' ? getAgentColor(agent) : null;

    return (
      <View style={styles.messageWrapper}>
        {/* Show agent badge for specialist agents */}
        {!isUser && agent && agent !== 'alter_ego' && (
          <View style={styles.agentBadge}>
            <View
              style={[
                styles.agentDot,
                { backgroundColor: agentColor || colors.primary },
              ]}
            />
            <Text
              style={[
                styles.agentName,
                { color: agentColor || colors.primary },
              ]}
            >
              {item.user.name}
            </Text>
          </View>
        )}
        <View
          style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}
        >
          <View
            style={[
              styles.bubble,
              isUser
                ? [
                    styles.userBubble,
                    { backgroundColor: colors.glassBackgroundStrong },
                  ]
                : [
                    styles.aiBubble,
                    { backgroundColor: colors.glassBackground },
                  ],
              isError && [styles.errorBubble, { borderColor: colors.error }],
              agentColor && { borderLeftWidth: 3, borderLeftColor: agentColor },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: colors.text },
                isError && { color: colors.error },
              ]}
            >
              {item.text}
            </Text>
          </View>
        </View>
        {showTimestamp && (
          <Text
            style={[
              styles.timestamp,
              { color: colors.textMuted },
              isUser ? styles.timestampRight : styles.timestampLeft,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        )}
      </View>
    );
  };

  // Render context chips at top
  const renderContextChips = () => {
    if (messages.length > 2) return null; // Hide after conversation starts

    const hour = new Date().getHours();
    const timeOfDay =
      hour >= 5 && hour < 12
        ? 'Morning'
        : hour >= 12 && hour < 17
        ? 'Afternoon'
        : hour >= 17 && hour < 21
        ? 'Evening'
        : 'Night';

    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.contextChipsContainer}
      >
        <View style={styles.contextChipsRow}>
          <View
            style={[
              styles.contextChip,
              { backgroundColor: colors.glassBackground },
            ]}
          >
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text
              style={[styles.contextChipText, { color: colors.textSecondary }]}
            >
              {timeOfDay}
            </Text>
          </View>

          {activePlan && (
            <View
              style={[
                styles.contextChip,
                { backgroundColor: colors.glassBackground },
              ]}
            >
              <Ionicons name="flag-outline" size={12} color={colors.primary} />
              <Text
                style={[
                  styles.contextChipText,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {activePlan.title.length > 15
                  ? activePlan.title.substring(0, 15) + '...'
                  : activePlan.title}
              </Text>
            </View>
          )}

          <View
            style={[
              styles.contextChip,
              { backgroundColor: colors.glassBackground },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={12}
              color={colors.primary}
            />
            <Text
              style={[styles.contextChipText, { color: colors.textSecondary }]}
            >
              AI Ready
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render suggestions
  const renderSuggestions = () => {
    if (!showSuggestions || messages.length > 2) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.suggestionsContainer}
      >
        <Text style={[styles.suggestionsTitle, { color: colors.textMuted }]}>
          Quick prompts
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}
        >
          {suggestions.map((suggestion, index) => (
            <Animated.View
              key={suggestion.text}
              entering={SlideInRight.delay(index * 50).duration(300)}
            >
              <Pressable
                style={[
                  styles.suggestionPill,
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: colors.glassBorder,
                  },
                ]}
                onPress={() => handleSuggestionTap(suggestion.prompt)}
              >
                <Ionicons
                  name={suggestion.icon as any}
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {suggestion.text}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageRow, styles.aiRow]}>
        <View
          style={[
            styles.bubble,
            styles.aiBubble,
            styles.typingBubble,
            { backgroundColor: colors.glassBackground },
          ]}
        >
          <View style={styles.typingDots}>
            <View
              style={[
                styles.dot,
                styles.dot1,
                { backgroundColor: colors.textMuted },
              ]}
            />
            <View
              style={[
                styles.dot,
                styles.dot2,
                { backgroundColor: colors.textMuted },
              ]}
            />
            <View
              style={[
                styles.dot,
                styles.dot3,
                { backgroundColor: colors.textMuted },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={getGradientArray('chat')}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <View
          style={[styles.keyboardContainer, { paddingBottom: keyboardHeight }]}
        >
          {/* Context Chips */}
          {renderContextChips()}

          <View
            style={styles.chatContainer}
            onTouchStart={() => {
              if (keyboardVisible) Keyboard.dismiss();
            }}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.listContent}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={renderSuggestions}
              ListFooterComponent={renderTypingIndicator}
            />
          </View>
          <ChatInputBar
            onSend={handleSend}
            onVoiceToggle={handleVoiceToggle}
            onAttachmentPress={() => {}}
            isListening={isListening}
            isLoading={isTyping}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  // Context chips
  contextChipsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  contextChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  contextChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Suggestions
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  suggestionsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  suggestionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageWrapper: {
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  errorBubble: {
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  typingBubble: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    // color set dynamically
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 8,
  },
  timestampLeft: {
    marginLeft: 4,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginLeft: 4,
    gap: 6,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
});
