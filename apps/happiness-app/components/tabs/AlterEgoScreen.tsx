import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
} from 'react-native-reanimated';

import { ChatInputBar } from '../chat/ChatInputBar';
import { ChatMessage, sendMessageToAI } from '../chat/ChatHelpers';
import { AVATAR_PRESETS, SUGGESTION_CHIPS } from '@/constants/Avatars';
import { useUserStore } from '@/stores/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useVoiceContext } from '@/contexts/VoiceContext';
import haptics from '@/lib/haptics';
import * as Speech from 'expo-speech';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function VoiceWaveAnimation({ color = '#007AFF' }: { color?: string }) {
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.5);
  const wave3 = useSharedValue(0.4);
  const wave4 = useSharedValue(0.6);
  const wave5 = useSharedValue(0.7);

  useEffect(() => {
    wave1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave2.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 350, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 350, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave3.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 450, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 450, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave4.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 380, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 380, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
    wave5.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 420, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.7, { duration: 420, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const createBarStyle = (sharedValue: any) =>
    useAnimatedStyle(() => ({
      height: `${sharedValue.value * 100}%`,
    }));

  return (
    <View style={styles.waveContainer}>
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, createBarStyle(wave1)]} />
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, createBarStyle(wave2)]} />
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, createBarStyle(wave3)]} />
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, createBarStyle(wave4)]} />
      <Animated.View style={[styles.waveBar, { backgroundColor: color }, createBarStyle(wave5)]} />
    </View>
  );
}

export function AlterEgoScreen() {
  const { colors, isDark, getGradientArray } = useTheme();
  const { hapticEnabled } = useUserStore();
  const {
    isListening,
    isTranscribing,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  } =
    useVoiceContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAvatarIndex, setCurrentAvatarIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentAvatar = AVATAR_PRESETS[currentAvatarIndex];

  // Orb Animations
  const orbScale = useSharedValue(1);
  const orbOpacity = useSharedValue(0.8);
  const orbGlowRadius = useSharedValue(40);
  const orbPosition = useSharedValue(0);

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
      transform: [{ scale }, { translateY }],
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
      haptics.light();
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
        haptics.success();
      }

      // Override the AI name with current avatar
      const avatarResponse: ChatMessage = {
        ...response,
        user: { _id: 2, name: currentAvatar.name },
      };

      // Speak the response if not muted
      if (!isMuted && avatarResponse.text) {
        Speech.speak(avatarResponse.text, {
          rate: 0.9,
          pitch: 1.0,
        });
      }

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
        haptics.warning();
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleVoiceToggle = async (recording: boolean) => {
    if (recording) {
      // Stop any ongoing speech
      Speech.stop();
      
      // Start recording using shared context
      const started = await startRecording();
      if (!started && hapticEnabled) {
        haptics.error();
      }
    } else {
      // Stop recording and get transcription from shared context
      try {
        const text = await stopRecording();
        if (text && text.trim()) {
          handleSend(text);
        } else if (text === '' && hapticEnabled) {
          haptics.warning();
        }
      } catch (error) {
        console.error('Voice error:', error);
        if (hapticEnabled) {
          haptics.error();
        }
      }
    }
  };

  const handleSuggestionPress = (suggestion: (typeof SUGGESTION_CHIPS)[0]) => {
    if (hapticEnabled) {
      haptics.selection();
    }
    handleSend(suggestion.text);
  };

  const handleMuteToggle = () => {
    if (hapticEnabled) {
      haptics.selection();
    }
    setIsMuted(!isMuted);
  };

  const handleCamera = async () => {
    if (hapticEnabled) {
      haptics.selection();
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission',
        'Camera access is required to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      // Handle image - could send to chat or store
      console.log('Camera image:', result.assets[0].uri);
      if (hapticEnabled) {
        haptics.success();
      }
    }
  };

  const handleAttach = () => {
    if (hapticEnabled) {
      haptics.selection();
    }
    setShowAttachments(true);
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
        {isUser ? (
          <View style={styles.userMessageContainer}>
            <View
              style={[
                styles.userBubble,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 30, 40, 0.6)'
                    : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
            >
              <Text style={[styles.messageText, { color: colors.text }]}>
                {item.text}
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.aiBubble,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 40, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
          >
            <Text style={[styles.messageText, { color: colors.text }]}>
              {item.text}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

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
        onTouchStart={() => Keyboard.dismiss()}
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

        {/* Orb Container (no swipe) */}
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

          {/* Status Text */}
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {getStatusText()}
          </Text>

          {/* Voice Wave Animation */}
          {isListening && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.voiceWaveWrapper}>
              <VoiceWaveAnimation color={currentAvatar.colors.primary} />
            </Animated.View>
          )}

          {/* Floating Action Buttons */}
          <Animated.View
            entering={SlideInRight.delay(200)}
            style={styles.floatingActionButtons}
          >
            <Pressable
              style={[
                styles.floatingActionButton,
                { 
                  backgroundColor: colors.glassBackground,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
              ]}
              onPress={handleMuteToggle}
            >
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={20} 
                color={colors.text} 
              />
            </Pressable>

            {/* Camera button moved to ChatInputBar */}

            <Pressable
              style={[
                styles.floatingActionButton,
                { 
                  backgroundColor: colors.glassBackground,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
              ]}
              onPress={handleAttach}
            >
              <Ionicons name="attach" size={20} color={colors.text} />
            </Pressable>
          </Animated.View>
        </Animated.View>

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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.inputContainer}>
            <ChatInputBar
              onSend={handleSend}
              onVoiceToggle={handleVoiceToggle}
              isListening={isListening}
              isLoading={isThinking}
              isTranscribing={isTranscribing}
              recordingDuration={duration}
              onCancelRecording={cancelRecording}
              showCamera={true}
              onCameraPress={handleCamera}
            />
          </View>
        </KeyboardAvoidingView>
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
  voiceWaveWrapper: {
    marginTop: 24,
    height: 60,
    justifyContent: 'center',
  },
  floatingActionButtons: {
    position: 'absolute',
    right: 20,
    bottom: 130,
    gap: 12,
  },
  floatingActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 60,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 12,
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
    marginBottom: 16,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiBubble: {
    maxWidth: '80%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderBottomLeftRadius: 6,
  },
  aiMessageText: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '90%',
    paddingHorizontal: 20,
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: '80%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
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
