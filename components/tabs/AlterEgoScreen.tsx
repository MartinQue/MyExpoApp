import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Platform,
  Keyboard,
  FlatList,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ChatInputBar } from '../chat/ChatInputBar';
import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { AVATAR_PRESETS, SUGGESTION_CHIPS } from '@/constants/Avatars';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AlterEgoScreen() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { hapticEnabled } = useUserStore();
  const { isListening, isTranscribing, startRecording, stopRecording } =
    useVoiceContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const currentAvatar = AVATAR_PRESETS[currentAvatarIndex];

  // Orb Animations
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.8);
  const orbGlowRadius = useSharedValue(40);
  const orbPosition = useSharedValue(0); // 0 = center, 1 = top
  const swipeTranslateX = useSharedValue(0);

  // State-based animation modifiers
  const thinkingPulse = useSharedValue(1);
  const listeningPulse = useSharedValue(1);

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        _id: `greeting-${currentAvatar.id}`,
        text: currentAvatar.greeting,
        createdAt: new Date(),
        user: { _id: 2, name: currentAvatar.name },
      },
    ]);
  }, [currentAvatar.id]);

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

  // Base breathing animation
  useEffect(() => {
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orbOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.85, { duration: 2500 })
      ),
      -1,
      true
    );
    orbGlowRadius.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 2500 }),
        withTiming(35, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);

  // Thinking state animation
  useEffect(() => {
    if (isThinking) {
      thinkingPulse.value = withRepeat(
        withSequence(
          withTiming(1.15, {
            duration: 400,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.95, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      thinkingPulse.value = withSpring(1);
    }
  }, [isThinking]);

  // Listening state animation
  useEffect(() => {
    if (isListening) {
      listeningPulse.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 300 }),
          withTiming(1, { duration: 300 })
        ),
        -1,
        true
      );
    } else {
      listeningPulse.value = withSpring(1);
    }
  }, [isListening]);

  // Move orb when messages appear
  useEffect(() => {
    if (messages.length > 1) {
      setShowMessages(true);
      orbPosition.value = withSpring(1, { damping: 15, stiffness: 100 });
    }
  }, [messages.length]);

  const switchAvatar = useCallback(
    (direction: 'left' | 'right') => {
      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      setCurrentAvatarIndex((prev) => {
        if (direction === 'left') {
          return prev === 0 ? AVATAR_PRESETS.length - 1 : prev - 1;
        } else {
          return prev === AVATAR_PRESETS.length - 1 ? 0 : prev + 1;
        }
      });

      // Reset messages for new avatar
      setMessages([]);
      setShowMessages(false);
      orbPosition.value = withSpring(0);
    },
    [hapticEnabled, orbPosition]
  );

  // Swipe gesture for avatar switching
  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      swipeTranslateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 50) {
        if (event.translationX > 0) {
          runOnJS(switchAvatar)('left');
        } else {
          runOnJS(switchAvatar)('right');
        }
      }
      swipeTranslateX.value = withSpring(0);
    });

  const animatedOrbStyle = useAnimatedStyle(() => {
    const scale = orbScale.value * thinkingPulse.value;
    const translateY = interpolate(
      orbPosition.value,
      [0, 1],
      [0, -SCREEN_HEIGHT * 0.2],
      Extrapolation.CLAMP
    );
    const size = interpolate(
      orbPosition.value,
      [0, 1],
      [180, 90],
      Extrapolation.CLAMP
    );

    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [
        { scale },
        { translateY },
        { translateX: swipeTranslateX.value * 0.3 },
      ],
      opacity: orbOpacity.value,
      shadowRadius: orbGlowRadius.value * listeningPulse.value,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            orbPosition.value,
            [0, 1],
            [0, -40],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMsg: ChatMessage = {
      _id: `user_${Date.now()}`,
      text: text.trim(),
      createdAt: new Date(),
      user: { _id: 1, name: 'You' },
    };

    setMessages((prev) => [...prev, userMsg]);
    scrollToBottom();
    setIsThinking(true);

    try {
      // Use avatar-specific system prompt
      const response = await sendMessageToAI(text, {
        systemPrompt: currentAvatar.systemPrompt,
      });

      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Override the AI name with current avatar
      const avatarResponse: ChatMessage = {
        ...response,
        user: { _id: 2, name: currentAvatar.name },
      };

      setMessages((prev) => [...prev, avatarResponse]);
      scrollToBottom();
    } catch (error) {
      console.error('AlterEgo error:', error);

      setMessages((prev) => [
        ...prev,
        {
          _id: `error_${Date.now()}`,
          text: "I felt that pause. Take your time, I'm here.",
          createdAt: new Date(),
          user: { _id: 2, name: currentAvatar.name },
        },
      ]);

      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } finally {
      setIsThinking(false);
    }
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

  const handleSuggestionPress = (suggestion: (typeof SUGGESTION_CHIPS)[0]) => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    handleSend(suggestion.text);
  };

  const getStatusText = () => {
    if (isThinking) return `${currentAvatar.name} is thinking...`;
    if (isListening) return 'Listening...';
    if (messages.length > 1) return `Chatting with ${currentAvatar.name}`;
    return `${currentAvatar.emoji} ${currentAvatar.name}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.user._id === 1;

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
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
                  {
                    backgroundColor: colors.glassBackground,
                    borderColor: `${currentAvatar.colors.primary}40`,
                  },
                ],
          ]}
        >
          <Text style={[styles.messageText, { color: colors.text }]}>
            {item.text}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderAvatarIndicator = () => (
    <View style={styles.avatarIndicatorRow}>
      {AVATAR_PRESETS.map((avatar, index) => (
        <Pressable
          key={avatar.id}
          onPress={() => {
            if (index !== currentAvatarIndex) {
              if (hapticEnabled) Haptics.selectionAsync();
              setCurrentAvatarIndex(index);
              setMessages([]);
              setShowMessages(false);
              orbPosition.value = withSpring(0);
            }
          }}
        >
          <View
            style={[
              styles.avatarDot,
              index === currentAvatarIndex && {
                backgroundColor: avatar.colors.primary,
                width: 20,
              },
            ]}
          />
        </Pressable>
      ))}
    </View>
  );

  const renderSuggestionChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.suggestionsContainer}
    >
      {SUGGESTION_CHIPS.map((chip) => (
        <Pressable
          key={chip.id}
          style={[
            styles.suggestionChip,
            { borderColor: `${currentAvatar.colors.primary}40` },
          ]}
          onPress={() => handleSuggestionPress(chip)}
        >
          <Ionicons
            name={chip.icon as any}
            size={14}
            color={currentAvatar.colors.primary}
          />
          <Text style={styles.suggestionText}>{chip.text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={
          isDark
            ? [currentAvatar.colors.gradient[2], '#0D0D15', '#050508']
            : [
                currentAvatar.colors.gradient[0] + '40',
                colors.background,
                colors.surface,
              ]
        }
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView
        style={styles.content}
        edges={['left', 'right']}
        onTouchStart={() => {
          if (keyboardVisible) Keyboard.dismiss();
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarName, { color: colors.text }]}>
              {currentAvatar.name}
            </Text>
            <Text
              style={[styles.avatarPersonality, { color: colors.textMuted }]}
            >
              {currentAvatar.personality}
            </Text>
          </View>
        </View>

        {/* Swipeable Orb Container */}
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.orbSection, animatedContainerStyle]}>
            <View style={styles.orbWrapper}>
              {/* Outer glow rings */}
              <View
                style={[
                  styles.glowRing,
                  styles.glowRing1,
                  { borderColor: `${currentAvatar.colors.primary}20` },
                ]}
              />
              <View
                style={[
                  styles.glowRing,
                  styles.glowRing2,
                  { borderColor: `${currentAvatar.colors.primary}10` },
                ]}
              />

              {/* Main orb with avatar gradient */}
              <Animated.View
                style={[
                  styles.orb,
                  animatedOrbStyle,
                  {
                    backgroundColor: currentAvatar.colors.primary,
                    shadowColor: currentAvatar.colors.glow,
                  },
                ]}
              >
                <LinearGradient
                  colors={[...currentAvatar.colors.gradient]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>
            </View>

            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              {getStatusText()}
            </Text>
            {!showMessages && (
              <>
                {renderAvatarIndicator()}
                <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
                  ← Swipe to change persona →
                </Text>
              </>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Suggestion Chips (shown before messages) */}
        {!showMessages && messages.length <= 1 && (
          <Animated.View entering={FadeIn.delay(500)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContainer}
            >
              {SUGGESTION_CHIPS.map((chip) => (
                <Pressable
                  key={chip.id}
                  style={[
                    styles.suggestionChip,
                    {
                      borderColor: `${currentAvatar.colors.primary}40`,
                      backgroundColor: colors.glassBackground,
                    },
                  ]}
                  onPress={() => handleSuggestionPress(chip)}
                >
                  <Ionicons
                    name={chip.icon as any}
                    size={14}
                    color={currentAvatar.colors.primary}
                  />
                  <Text style={[styles.suggestionText, { color: colors.text }]}>
                    {chip.text}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Messages Area */}
        {showMessages && (
          <View style={styles.messagesContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id.toString()}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
            />
          </View>
        )}

        {/* Input Area */}
        <View
          style={[styles.inputContainer, { paddingBottom: keyboardHeight }]}
        >
          <ChatInputBar
            onSend={handleSend}
            onVoiceToggle={handleVoiceToggle}
            onAttachmentPress={() => {}}
            isListening={isListening}
            isLoading={isThinking}
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  avatarInfo: {
    flex: 1,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatarPersonality: {
    fontSize: 13,
    marginTop: 2,
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 16,
  },
  orbWrapper: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 150,
    borderWidth: 1,
  },
  glowRing1: {
    width: 240,
    height: 240,
  },
  glowRing2: {
    width: 300,
    height: 300,
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 20,
  },
  statusText: {
    marginTop: 24,
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: '500',
  },
  avatarIndicatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  avatarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 12,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  messagesList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    marginTop: 'auto',
  },
});
