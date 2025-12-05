import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
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
import { useUserStore } from '@/stores/userStore';
import { Config } from '@/constants/Config';
import { useElevenLabs } from '@/lib/voice/elevenLabsService';

// Get contextual greeting based on time
const getContextualGreeting = (userName: string): string => {
  const hour = new Date().getHours();
  const name = userName || 'there';

  if (hour >= 5 && hour < 12) {
    return `Good morning, ${name}! Fresh day, fresh start. What's on your mind?`;
  }
  if (hour >= 12 && hour < 17) {
    return `Hey ${name}! Afternoon check-in - how's your day going?`;
  }
  if (hour >= 17 && hour < 21) {
    return `Evening, ${name}! Time to unwind. What would you like to talk about?`;
  }
  return `Hey ${name}! Still up? I'm here if you need to chat.`;
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

  // ElevenLabs TTS for seamless voice responses
  const { speak: speakWithElevenLabs, stop: stopSpeaking, isSpeaking } = useElevenLabs();

  // Initialize messages with contextual greeting from AI
  const initialMessages = useMemo(
    () => createInitialMessages(user?.name || ''),
    [user?.name]
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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
        `The following API keys are missing:\n\n${missingKeys.join(
          '\n'
        )}\n\nSome features may not work properly. Please add them to your environment configuration.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
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

    // Stop any ongoing speech when user sends a new message (seamless conversation)
    if (isSpeaking) {
      await stopSpeaking();
    }

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
        setTimeout(
          () => reject(new Error('Request timed out after 12 seconds')),
          12000
        );
      });

      const aiResponsePromise = sendMessageToAI(text);

      // Race between AI response and timeout
      const response = await Promise.race([aiResponsePromise, timeoutPromise]);

      // Haptic feedback on response
      haptics.success();

      setMessages((prev) => [...prev, response]);
      scrollToBottom();

      // Speak the AI response using ElevenLabs TTS for seamless conversation
      if (response.text) {
        await speakWithElevenLabs(response.text);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Surface error to user as ChatMessage (not just console)
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong';
      const isTimeout = errorMessage.includes('timed out');

      const errorMsg: ChatMessage = {
        _id: `error_${Date.now()}`,
        text: isTimeout
          ? 'The request timed out. The AI might be busy - would you like to try again?'
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
              { color: isError ? colors.error : colors.text },
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
                },
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
            <Text
              style={[
                styles.timestamp,
                styles.timestampLeft,
                { color: colors.textMuted },
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
          )}
        </Animated.View>
      );
    }

    // User messages - bubble with theme-aware glassmorphism
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.messageWrapper}
      >
        <View style={styles.userMessageContainer}>
          <View style={[
            styles.userBubble,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 40, 0.6)' : 'rgba(45, 42, 38, 0.08)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 42, 38, 0.12)',
            }
          ]}>
            <Text style={[styles.userMessageText, { color: colors.text }]}>
              {item.text}
            </Text>
          </View>
        </View>
        {showTimestamp && (
          <Text
            style={[
              styles.timestamp,
              styles.timestampRight,
              { color: colors.textMuted },
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        )}
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            keyboardVerticalOffset={0}
          >
            {/* Chat Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.listContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={renderTypingIndicator}
            />

            {/* Grok-style Input Bar */}
            <ChatInputBar
              onSend={handleSend}
              onVoiceToggle={handleVoiceToggle}
              isListening={isListening}
              isLoading={isTyping}
              isTranscribing={isTranscribing}
              recordingDuration={duration}
              onCancelRecording={cancelRecording}
              placeholder="Ask Anything"
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
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
    borderRadius: 20,
    borderBottomRightRadius: 6,
    borderWidth: 1,
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
