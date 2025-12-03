import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  Alert,
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
import { Config } from '@/constants/Config';

// Context-aware suggestions based on time
// Import Epoch service for intelligent suggestions
import { epochService, EpochContext } from '@/lib/api/epochService';

const getTimeSuggestions = async (
  userName?: string
): Promise<
  {
    icon: string;
    text: string;
    prompt: string;
  }[]
> => {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  // Try to get Epoch suggestions first (if enabled)
  try {
    const epochContext: EpochContext = {
      timeOfDay:
        hour >= 5 && hour < 12
          ? 'morning'
          : hour >= 12 && hour < 17
          ? 'afternoon'
          : hour >= 17 && hour < 21
          ? 'evening'
          : 'night',
      dayOfWeek: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ][day],
      date: new Date().toISOString().split('T')[0],
    };

    const epochSuggestions = await epochService.getConversationStarters(
      epochContext
    );
    if (epochSuggestions.length > 0) {
      // Convert Epoch suggestions to Ask screen format
      return epochSuggestions.slice(0, 4).map((s) => ({
        icon:
          s.category === 'action'
            ? 'rocket'
            : s.category === 'reflection'
            ? 'leaf'
            : s.category === 'exploration'
            ? 'compass'
            : 'heart',
        text: s.context,
        prompt: s.prompt,
      }));
    }
  } catch (error) {
    console.warn('Epoch suggestions failed, using local fallback:', error);
  }

  // Fallback to local suggestions

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
  const {
    isListening,
    isTranscribing,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    error: voiceError,
  } = useVoiceContext();
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

  // Get time-based suggestions (with Epoch integration)
  const [suggestions, setSuggestions] = useState<
    { icon: string; text: string; prompt: string }[]
  >([]);

  // Validate API keys on mount
  useEffect(() => {
    const missingKeys: string[] = [];
    if (!Config.googleAiApiKey) {
      missingKeys.push('Google AI API Key');
    }
    if (!Config.elevenLabsApiKey) {
      missingKeys.push('ElevenLabs API Key');
    }
    
    if (missingKeys.length > 0) {
      Alert.alert(
        'Missing API Keys',
        `The following API keys are missing:\n\n${missingKeys.join('\n')}\n\nSome features may not work properly. Please add them to your environment configuration.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, []);

  useEffect(() => {
    getTimeSuggestions(user?.name).then(setSuggestions);
  }, [user?.name]);

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

  // Show voice errors to user
  useEffect(() => {
    if (voiceError) {
      setMessages((prev) => [
        ...prev,
        {
          _id: `error_${Date.now()}`,
          text: `Voice error: ${voiceError}. Please try again or type your message.`,
          createdAt: new Date(),
          user: { _id: 2, name: 'Alter Ego' },
          error: true,
        },
      ]);
      haptics.error();
    }
  }, [voiceError]);

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

    // Local echo: Add user message immediately (<100ms)
    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };

    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();
    
    // Show thinking state
    setIsTyping(true);

    try {
      // Add 12-second timeout with Promise.race
      const timeoutPromise = new Promise<ChatMessage>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 12 seconds')), 12000);
      });
      
      const aiResponsePromise = sendMessageToAI(text);
      
      // Race between AI response and timeout
      const response = await Promise.race([aiResponsePromise, timeoutPromise]);

      // Haptic feedback on response
      haptics.success();

      setMessages((prev) => [...prev, response]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);

      // Surface error to user as ChatMessage (not just console)
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      const isTimeout = errorMessage.includes('timed out');
      
      const errorMsg: ChatMessage = {
        _id: `error_${Date.now()}`,
        text: isTimeout 
          ? "The request timed out. The AI might be busy - would you like to try again?"
          : `Error: ${errorMessage}. Tap below to retry.`,
        createdAt: new Date(),
        user: { _id: 2, name: 'Alter Ego' },
        error: true,
        retryPrompt: text, // Store original prompt for retry
      };

      setMessages((prev) => [...prev, errorMsg]);
      haptics.error();
    } finally {
      setIsTyping(false);
    }
  };

  // Retry handler for failed messages
  const handleRetry = (prompt: string) => {
    haptics.button();
    handleSend(prompt);
  };

  // Handle suggestion tap
  const handleSuggestionTap = (prompt: string) => {
    haptics.button();
    handleSend(prompt);
  };

  const handleVoiceToggle = async (recording: boolean) => {
    if (recording) {
      // Start recording using shared context
      const started = await startRecording();
      if (!started) {
        // Show user-friendly error
        setMessages((prev) => [
          ...prev,
          {
            _id: `error_${Date.now()}`,
            text: "Couldn't start recording. Check your microphone permissions in Settings.",
            createdAt: new Date(),
            user: { _id: 2, name: 'Alter Ego' },
            error: true,
          },
        ]);
        haptics.error();
      }
    } else {
      // Stop recording and get transcription from shared context
      try {
        const text = await stopRecording();
        if (text && text.trim()) {
          handleSend(text);
        } else if (text === '') {
          // Empty transcription - might be too short or unclear
          setMessages((prev) => [
            ...prev,
            {
              _id: `error_${Date.now()}`,
              text: "I didn't catch that. Could you try speaking again?",
              createdAt: new Date(),
              user: { _id: 2, name: 'Alter Ego' },
              error: true,
            },
          ]);
          haptics.warning();
        }
      } catch (error) {
        console.error('Voice error:', error);
        setMessages((prev) => [
          ...prev,
          {
            _id: `error_${Date.now()}`,
            text: "Something went wrong with voice input. Let's try typing instead.",
            createdAt: new Date(),
            user: { _id: 2, name: 'Alter Ego' },
            error: true,
          },
        ]);
        haptics.error();
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
    const retryPrompt = (item as any).retryPrompt;
    const agent = (item as any).agent as AgentType | undefined;
    const showTimestamp =
      index === messages.length - 1 ||
      messages[index + 1]?.user._id !== item.user._id;

    // Get agent color for non-alter_ego agents
    const agentColor =
      agent && agent !== 'alter_ego' ? getAgentColor(agent) : null;

    // AI messages - plain text, no bubble (Grok style)
    if (!isUser) {
      return (
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.messageWrapper}
        >
          {agent && agent !== 'alter_ego' && (
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
          <Text
            style={[
              styles.aiMessageText,
              { color: isError ? colors.error : 'rgba(255, 255, 255, 0.95)' },
            ]}
          >
            {item.text}
          </Text>
          {/* Retry button for error messages */}
          {isError && retryPrompt && (
            <Pressable
              style={[
                styles.retryButton,
                { 
                  backgroundColor: colors.glassBackground,
                  borderColor: colors.primary,
                }
              ]}
              onPress={() => handleRetry(retryPrompt)}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={[styles.retryButtonText, { color: colors.primary }]}>
                Retry
              </Text>
            </Pressable>
          )}
          {showTimestamp && (
            <Text style={[styles.timestamp, styles.timestampLeft, { color: colors.textMuted }]}>
              {formatTime(item.createdAt)}
            </Text>
          )}
        </Animated.View>
      );
    }

    // User messages - keep bubble with dark glassmorphism
    return (
      <Animated.View 
        entering={FadeIn.duration(300)}
        style={styles.messageWrapper}
      >
        <View style={styles.userMessageContainer}>
          <View style={styles.userBubble}>
            <Text style={[styles.userMessageText, { color: colors.text }]}>
              {item.text}
            </Text>
          </View>
        </View>
        {showTimestamp && (
          <Text style={[styles.timestamp, styles.timestampRight, { color: colors.textMuted }]}>
            {formatTime(item.createdAt)}
          </Text>
        )}
      </Animated.View>
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
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
            isListening={isListening}
            isLoading={isTyping}
            isTranscribing={isTranscribing}
            recordingDuration={duration}
            onCancelRecording={cancelRecording}
          />
        </KeyboardAvoidingView>
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
    marginBottom: 12,
  },
  // AI message styles - Grok aesthetic (no bubble)
  aiMessageText: {
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  // User message styles - Dark glassmorphism bubble
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  userBubble: {
    backgroundColor: 'rgba(30, 30, 40, 0.6)',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  errorBubble: {
    borderWidth: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
  // Retry button
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginLeft: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Missing styles added for typing indicator
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '85%',
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
  },
  typingBubble: {
    paddingVertical: 16,
  },
});
